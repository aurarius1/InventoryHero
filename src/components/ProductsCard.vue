
<template >
    <v-layout justify="center">
        <v-col>
            <v-card  class="room-card">
                <v-card-title align="start" :id='id' >
                    {{ productName }}
                </v-card-title>
                <div class="d-flex align-center justify-space-evenly room-info mt-1 mb-2 ms-2 me-2 rounded-pill" >
                    <v-list-item density="compact" >
                        <v-list-item-subtitle>
                            <v-icon @click="totalAmount(id)" class="me-3" icon="fa:fas fa-boxes"/>{{displayAmount}}
                            </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item density="compact" >
                        <v-list-item-subtitle>
                            <v-icon @click="increaseAmount(id, box_id, room_id)" class="me-3" icon="mdi-plus"/>
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item density="compact">
                        <v-list-item-subtitle>
                            <v-icon @click="decreaseAmount(id)" size="x-large" icon="mdi-minus"/>
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item density="compact">
                        <v-list-item-subtitle>
                            <v-icon @click="openDetailModal()" size="large" icon="mdi-information"/>
                        </v-list-item-subtitle>
                    </v-list-item>
                </div>
            </v-card>
        </v-col>
    </v-layout>
    <products-detail-modal
        @closeDetailModal="closeModal"
        @productDeleted="deletedProduct"
        :id="this.id"
         v-model="this.dialog"
        :name="this.productName"
        :box_id="this.curr_box_id"
        :room_id="this.curr_room_id"
        :amount="this.displayAmount"
        :key="this.update_modal"
    />
</template>

<script>
import {
    DB_SB_increase_product_amount
} from '@/db/supabase';
import { DB_SB_decrease_product_amount } from '@/db/supabase';
import { DB_SB_get_product } from '@/db/supabase';
import ProductsDetailModal from "@/modals/ProductsDetailModal.vue";

  export default {
      components: {
        ProductsDetailModal
      },
      props: {
          id: Number,
          room_id: Number,
          box_id: Number,
          productName: String,
          amount: Number,

      },
      data(){
        return{
            updatedAmount:null,
            dialog: false,
            curr_room_id: this.room_id,
            curr_box_id: this.box_id,
            update_modal: 0,
        };
      },
      methods: {
          deletedProduct()
          {
            this.dialog=false;
            this.$emit("productDeleted");
          },
          closeModal(new_room = undefined, new_box = undefined, new_amount = -1)
          {

              if(new_room !== undefined)
              {
                  this.curr_room_id = new_room.id;
                  this.curr_box_id = -1;
                  this.update_modal += 1;
              }
              if(new_box !== undefined)
              {
                  this.curr_box_id = new_box.id;
                  this.curr_room_id = -1;
                  this.update_modal += 1;
              }
              if(new_amount !== -1 && new_amount !== this.updatedAmount)
              {
                  this.updatedAmount = new_amount;
              }

              this.dialog = false;
          },
          openDetailModal()
          {
              this.dialog = true;
          },
          totalAmount: function(cardID)
          {
              console.log("Showing all products " + cardID);
          },
          increaseAmount: function(cardId, boxId, roomId)
          {
              DB_SB_increase_product_amount(cardId, boxId, roomId) .then(() => {
        
                return DB_SB_get_product(cardId, boxId, roomId);
            }) .then(updatedProduct => {
                this.updatedAmount = updatedProduct.amount;
                console.log("Updated product:", updatedProduct);
            
            })
            .catch(error => {
                console.log(error.message);
            });
             
          },
          decreaseAmount: function(cardId)
          {
              if(this.displayAmount === 0)
              {
                  return;
              }
              DB_SB_decrease_product_amount(cardId).then(() => 
              {
                return DB_SB_get_product(cardId);
            }) .then(updatedProduct => {
                this.updatedAmount = updatedProduct.amount;
                console.log("Updated product:", updatedProduct);
            
            })
            .catch(error => {
                console.log(error.message);
            });
          }
      },
      computed: {
        displayAmount: function(){
            return this.updatedAmount !== null ? this.updatedAmount : this.amount;
        }
      },
      beforeMount(){




      }
  }
  
</script>


<style scoped>
    .room-info {
        background-color: var(--color-blue);
        color: white;
        height: 2em;
    }
    .room-card{
        background-color: var(--color-darker);
        color: white;
    }


</style>