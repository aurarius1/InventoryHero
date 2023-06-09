<template>


    <SandwichMenu :title="this.title"/>
    <div class="scrollableDiv">

        <search-bar @valueUpdated="sortLocations"/>
        <load-animation v-if="this.loading"></load-animation>
        <RoomCard
            v-for="r in this.rooms"
            @addItemToRoom="displayModal"
            @roomDeleted="updateRooms"
            @refreshData="get_rooms"
            class="card"
            :key="r.id"
            :id="r.id"
            :roomName="r.name"
            :numBoxes="r.box_cnt"
            :numProducts="r.product_cnt"
        />

        <div id="spacing"></div>
    </div>
    <add-modal
        :preselected_room="this.preselectedRoom"
        :navbarItems="this.displayedNavbarItems"
        :defaultAddView="this.defaultModalView"
        v-model="this.addModalVisibility"
        :data_changed="this.data_changed"
        @initAck="this.data_changed=false"
        @closeModal="closeModal()"
    />

    <dock
        :show_qr="false"
        @addButton="this.addModalVisibility = true"
    />

</template>

<script>
import RoomCard from "@/components/RoomCard.vue";
import SandwichMenu from "@/components/SandwichMenu.vue";
import LoadAnimation from "@/components/LoadAnimation.vue";
import SearchBar from '@/components/SearchBar.vue';
import Dock from "@/components/Dock.vue";


import AddModal from "@/modals/AddModal.vue";


import { DB_SB_delete_room, DB_SB_get_room_name, DB_SB_get_rooms, DB_SB_getStarredProducts} from '@/db/supabase';
import {getSettings, getUser} from "@/db/dexie";
import { Constants } from "@/global/constants";
import { rankLocationsBySearch } from '@/scripts/sort';
import QrDataModal from "@/modals/QrDataModal.vue";
import QrReaderModal from "@/modals/QrReaderModal.vue";
import {useToast} from "vue-toastification";




  
  export default {
    name: 'App',
    setup(){
        const toast = useToast();
        return {toast};
    },
    components: {
        QrReaderModal, QrDataModal,
        Dock,
        LoadAnimation,
        AddModal,
        RoomCard,
        SandwichMenu,
        SearchBar
    },
    data() {
        return {
            rooms: [],
            currentUser: "",
            addModalVisibility: false,
            Constants,
            title: this.$t('locations'),
            defaultModalView: Constants.LocationsView,
            displayedNavbarItems: Constants.All,
            preselectedRoom: {id: -1, name: this.$t('add_modal.location_placeholder')},
            loading: true,
            theme: "",
            data_changed: false,
        }
    },
    methods: {
        async updateRooms(id, name)
        {
            document.getElementById(id).setAttribute("hidden", true);
            if(!await DB_SB_delete_room(id)){
                this.toast.error(this.$t('locations_view.toasts.error.delete', {name: name}));
                return;
            }
            this.toast.success(this.$t('locations_view.toasts.success.delete', {name: name}));
            await this.get_rooms()
        },
        displayModal(id){
            DB_SB_get_room_name(id).then((room) => {
                this.preselectedRoom = {id: id, name: room};
                this.defaultModalView = Constants.ProductsView;
                this.displayedNavbarItems = [Constants.ProductsView, Constants.BoxesView];
                this.addModalVisibility = true;
            })
        },
        async get_rooms() {
            this.data_changed = true;
            const locations = await DB_SB_get_rooms(this.currentUser.username)
            this.rooms = rankLocationsBySearch(locations, "");
            this.loading = false;
            return locations
        },
        closeModal() {
            this.addModalVisibility = false;
            this.defaultModalView = Constants.LocationsView;
            this.displayedNavbarItems = Constants.All;
            this.preselectedRoom = "";
            this.get_rooms();
            DB_SB_getStarredProducts().then((res) => {
                this.starred_products = res;
            })
        },
        async sortLocations(search_word) {
            const locations = await this.get_rooms();
            this.rooms = rankLocationsBySearch(locations, search_word);
        }
    },
    beforeMount() {
        getUser().then((user) => {
            if(user === undefined)
            {
                this.$router.push("/");
            }
            this.currentUser = user;
            this.get_rooms();
        });
        getSettings().then((settings) => {
            this.theme =  settings.theme;
        })

    }

  }
</script>
  
<style scoped>
    .card {
        padding-left: 2.5%;
        padding-right: 2.5%;
    }
    .v-virtual-scroll{
        background: var(--color-dark-theme-background);
    }
    #spacing{
        height: calc(5vh + 25px);
    }
    ::-webkit-scrollbar { width: 0px;  }

    
  #content {
    position: absolute;
    top: 70px;
    width: 100%;
  }
</style>
  