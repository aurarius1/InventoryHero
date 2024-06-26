<script lang="ts">
import {defineComponent} from "vue";
import {Household} from "@/types";

import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {useAuthStore} from "@/store";
import HouseholdItem from "@/components/household/HouseholdItem.vue";
import useNewAxios from "@/composables/useNewAxios.ts";
import {HouseholdEndpoint} from "@/api/http";
import {notify} from "@kyvg/vue3-notification";
import {i18n} from "@/lang";
import InviteModal from "@/components/widgets/Households/InviteModal.vue";


export default defineComponent({
  name: "Household",
  computed: {
    joinedHouseholds(){
      console.log(this.authStore.user.id)
      return this.households.filter((household) => household.creator !== this.authStore.user.id)
    }
  },
  components: {InviteModal, HouseholdItem},
  setup(){
    const {axios} = useNewAxios("household");
    const authStore = useAuthStore();
    return {axios: axios as HouseholdEndpoint, authStore}
  },
  data(){
    return {
      households: [] as Array<Household>,
      loadingHouseholds: false,
      createHouseholdCollapsed: false,
      newHouseholdName: "" as string,
      saved: false,
      inviteModal: false,
      inviteId: NaN as number,
      rules: {
        required: (value: String) => !!value || this.$t('households.rules.name_required'),
      }
    }
  },
  async mounted(){
    await this.fetchHouseholds()
    this.createHouseholdCollapsed = this.households.length !== 0
  },
  methods: {
    notify,
    async fetchHouseholds(){
      this.loadingHouseholds = true;
      this.households = await this.axios.getHouseholds()
      console.log(this.households)
      if(this.authStore.user.household === null && this.households.length >= 1)
      {
        this.setDefaultHousehold(this.households[0].id)
      }
      this.loadingHouseholds = false;
    },
    async createHousehold(event: Event){
      event.preventDefault()
      const { valid } = await this.$refs.householdForm.validate();
      if(valid)
      {
        this.saved = true
        let creationSuccess = await this.axios.createHousehold(this.newHouseholdName)
        if(!creationSuccess)
        {
          this.saved = false
          return
        }
        this.newHouseholdName = ""
        this.saved = false
        this.createHouseholdCollapsed = true
        await this.fetchHouseholds()
      }
    },

    setDefaultHousehold(id: number){
      this.authStore.changeHousehold(this.households.find((elem) => elem.id === id))
      this.$notify({
        title: this.$t('toasts.titles.success.default_household_set'),
        type: "success"
      })

      if(this.authStore.returnUrl !== null)
      {
        this.authStore.followReturnUrl()
      }
    },
    toggleInviteModal(id: number){
      this.inviteId = id
      this.inviteModal = true
    },
    isJoinedHousehold(id: number){
      console.log(this.joinedHouseholds)
      for(let i = 0; i < this.joinedHouseholds.length; i++)
      {
        if(this.joinedHouseholds[i].id === id) {
          return true
        }
      }
      return false
    },
    leaveHousehold(id: number){
      this.$notify({
        title: this.$t('toasts.titles.info.leave_household'),
        type: "info"
      })
    },
    toggleEdit(id: number){
      this.$notify({
        title: this.$t('toasts.titles.info.edit_household'),
        type: "info"
      })
    }
  }
})


</script>

<template>

  <v-row
    :no-gutters="true"
    justify="center"
    class="fill-height"
  >
    <v-col
      cols="12"
      lg="8"
      class="d-flex flex-column fill-height"
    >
      <invite-modal
        v-model="inviteModal"
        :household-id="inviteId"
      />

      <v-card
          class="mb-4 flex-0-1"
          :elevation="5"
      >
        <v-progress-linear
            :indeterminate="true"
            :active="saved"
        />
        <v-card-title>
          <v-row
              :no-gutters="true"
          >
            <v-col>
              {{ $t('households.create_new.title')}}
            </v-col>
            <v-spacer/>

            <v-col
                class="d-flex justify-end align-center"
            >
              <font-awesome-icon
                  :icon="['fas', createHouseholdCollapsed ? 'plus' : 'minus']"
                  @click="createHouseholdCollapsed=!createHouseholdCollapsed"
              />
            </v-col>
          </v-row>
        </v-card-title>

        <v-slide-y-transition
          :group="true"
        >
          <v-card-text
              v-if="!createHouseholdCollapsed"
          >
            <v-form ref="householdForm" action="" @submit.prevent="">
              <v-text-field
                  density="compact"
                  hide-details="auto"
                  v-model="newHouseholdName"
                  :rules="[rules.required]"
                  validate-on="lazy"
                  :label="$t('households.create_new.labels.name')"
              >
                <template #append-inner>
                  <font-awesome-icon
                      :icon="['fas', 'times']"
                      v-if="newHouseholdName !== '' && newHouseholdName.length !== 0 && !saved"
                      @click="newHouseholdName = ''"
                  />
                </template>
              </v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions
              class="justify-end"
              v-if="!createHouseholdCollapsed"
          >
            <v-btn
                @click="createHousehold($event)"
            >
              <template #prepend>
                <font-awesome-icon
                    :icon="['fas', 'save']"
                />
              </template>
              {{ $t('households.create_new.save')}}
            </v-btn>
          </v-card-actions>
        </v-slide-y-transition>
      </v-card>
      <v-divider />
      <v-card
          ref="wrapper"
          class="mt-4 wrapper"
      >
        <v-progress-linear
            :indeterminate="true"
            :active="loadingHouseholds"
        />
        <v-card-text
            class="scroller-container pt-1 pl-0 pr-0 pb-0"
        >
          <DynamicScroller
              class="list"
              :items="households"
              style="height: 100%;"
              :min-item-size="30"
          >
            <template #default="{ item, index, active }">
              <DynamicScrollerItem
                  :item="item"
                  :active="active"
                  :size-dependencies="[
                        item.message,
                      ]"
                  :data-index="index"
              >
                <household-item
                    :is-joined="isJoinedHousehold(item.id)"
                    :title="item.name"
                    :r-cols="3"
                    :id="item.id"
                    @toggle-invite="toggleInviteModal"
                    @set-default-household="setDefaultHousehold"
                    @leave-household="leaveHousehold"
                    @toggle-edit="toggleEdit"
                />
                <v-divider
                    class="border-opacity-50"
                />
              </DynamicScrollerItem>
            </template>
            <template #after>

              <household-item

                  :title="$t('households.all_displayed')"
                  :r-cols="0"
                  title-class="d-flex justify-center align-center"
                  :actions="false"
              >
              </household-item>
            </template>

          </DynamicScroller>
        </v-card-text>


      </v-card>


    </v-col>
  </v-row>
</template>

<style scoped lang="scss">


.hovering{
  cursor: pointer;
  color: rgba(var(--v-theme-primary), 0.65);
}

.test{
  flex: 1 1
}
.wrapper{
  flex: auto
}
.scroller-container {
  overflow: hidden;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

</style>