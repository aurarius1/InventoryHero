<script setup lang="ts">

import {useNotification} from "@kyvg/vue3-notification";

const {
  title="",
  text="",
  cancelText="",
  confirmText="",
  cancelIcon="mdi-cancel",
  dialogOpened=false,
  onConfirm,
  onCancel
} = defineProps<{
  title?: string,
  text?: string,
  cancelText?: string,
  confirmText?: string,
  cancelIcon?: string,
  confirmIcon?: string,
  dialogOpened?: boolean,
  onConfirm?: () => void,
  onCancel?: () => void
}>()

const {notify} = useNotification()
const {t} = useI18n()

onBeforeRouteLeave(()=> {
  if(dialogOpened){
    notify({
      title: t("toasts.titles.info.close_dialog_first"),
      text: t("toasts.text.info.close_dialog_first"),
      type: "info"
    })
    return false
  }
})

</script>

<template>
  <v-dialog
      :model-value="dialogOpened"
      persistent
      no-click-animation
  >
    <v-row
      justify="center"
    >
      <v-col
        lg="6"
        cols="12"
      >
        <v-card
        >
          <template v-slot:title>
            <slot name="title">
              {{ title }}
            </slot>
          </template>
          <template v-slot:text>
            <slot name="text">
              {{ text }}
            </slot>
          </template>

          <v-card-actions
            class="overflow-auto"
          >
            <v-btn
                variant="tonal"
                :prepend-icon="cancelIcon"
                :text="cancelText"
                @click="onCancel"
                color="blue-grey-lighten-1"
            />
            <v-spacer />
            <v-btn
                variant="tonal"
                :prepend-icon="confirmIcon"
                :text="confirmText"
                @click="onConfirm"
                color="red-accent-2"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>