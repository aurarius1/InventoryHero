import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js'
import { getUser } from './dexie';


const URL = process.env.VUE_APP_URL
const KEY = process.env.VUE_APP_KEY

export const supabase = createClient(URL, KEY)


function HASH(val) {
    return CryptoJS.SHA3(val).toString(CryptoJS.enc.Hex)
}

export async function DB_SB_login(username, password) {
    const { data } = await supabase.from('users').select().eq("username", username).eq("password", HASH(password));
    const success = data.length < 1 ? false : true;
    return success;
}


export async function DB_SB_register(username, password) {
    const user = {
        username: username,
        password: HASH(password),
    }
    const { data } = await supabase.from('users').select().eq("username", username)
    if(data.length != 0) {
        console.log("[ERR] username already taken");
        return false;
    }
    await supabase.from('users').insert(user);
    return true;
}


export async function DB_SB_get_boxes_per_room(room_id, user)
{
    return await supabase.from("boxes").select("*").eq("room_id", room_id).eq("username", user)
}

export async function DB_SB_get_products_per_box(box_id, user)
{
    return await supabase.from("products").select("*").eq("box_id", box_id).eq("username", user)
}

export async function DB_SB_get_products_per_room(room_id, user)
{
    return await supabase.from("products").select("*").eq("room_id", room_id).eq("username", user)
}


export async function DB_SB_getStarredProducts() {
    const user = await getUser()
    const { data } = await supabase.from('products').select().eq("username", user.username).eq("starred", true)
    return data;
}

export async function DB_SB_getStarredProducts_per_box(box_id, user) {
    return await supabase.from('products').select("*").eq("box_id", box_id).eq("username", user).eq("starred", true)
}

export async function DB_SB_get_rooms(user){

    console.log(user);
    if(user === undefined)
    {
        user = await getUser();
    }


    const data = await supabase.from("rooms").select("*").eq("username", user);


    for(let i = 0; i < data.data.length; i++)
    {
        let curr_room = data.data.at(i);
        const box_data = await DB_SB_get_boxes_per_room(curr_room.id, user)
        const product_data = await DB_SB_get_products_per_room(curr_room.id, user);
        curr_room.box_cnt = box_data.data.length
        curr_room.product_cnt = product_data.data.length
    }


    return data.data;
}

export async function DB_SB_get_all_products(user){
    const {data} = await supabase.from("products").select("*").eq("username", user);
    return data
}

export async function DB_SB_get_all_products_per_storage_location(room_id, box_id, user = undefined){
    if(user === undefined)
        user = await getUser();
    let query = supabase.from("products").select("*").eq("username", user);
    let data;
    if(box_id !== -1)
    {
        data = await query.eq("box_id", box_id);
    }
    else if(room_id !== -1)
    {
        data = await query.eq("room_id", room_id);
    }
    else
    {
        return await DB_SB_get_all_products(user);
    }

    if(data === undefined || data.data === undefined)
        return [];

    return data.data;
}


export async function DB_SB_increase_product_amount(productId, boxId, roomId) {

    const { data, error } = await supabase.rpc("increase_product_amount", { productid:productId, boxid: boxId, roomid: roomId});
  
    if (error) {
      console.log("Error occurred:", error.message);
    } else {
      console.log(data)
      console.log("Product amount increased successfully");
    }
  }


  export async function DB_SB_decrease_product_amount(productId) {
    const { data, error } = await supabase.rpc("decrease_product_amount", {productid: productId });
  
    if (error) {
      console.log("Error occurred:", error.message);
    } else {
    console.log(data)
      console.log("Product amount decreased successfully");
    }
  }
  

  export async function DB_SB_get_product(productId, boxId, roomId) {
  
  
    const { data, error } = await supabase
      .from("MappingProduct")
      .select("*")
      .eq("product_id", productId)
      .eq("box_id", boxId)
      .eq("room_id", roomId)
      .single();
  
    if (error) {
      console.log("Error:", error.message);
      return null;
    }
  
    return data;
  }
  

export async function DB_SB_get_boxes(user, room = -1){

    let data;
    if(room === -1)
    {
        data = await supabase.from("boxes").select("*").eq("username", user);
    }
    else {
        data = await supabase.from("boxes").select("*").eq("username", user).eq("room_id", room);
    }



    for(let i = 0; i < data.data.length; i++)
    {
        let curr_box = data.data.at(i);
        const product_data = await DB_SB_get_products_per_box(curr_box.id, user);
        const starred_product = await DB_SB_getStarredProducts_per_box(curr_box.id, user)
        curr_box.product_cnt = product_data.data.length
        curr_box.starred_product_cnt = starred_product.data.length
    }

    return data.data;
}


export async function DB_SB_get_boxes_of_user(user, room =undefined) {
    let data;
    if(room !== undefined)
    {
        let room_id = await DB_SB_get_id_of_room(room);
        data = await supabase.from("boxes").select("*").eq("username", user.username).eq("room_id", room_id);
        //console.error(data);
    }
    else
    {
        data = await supabase.from("boxes").select("*").eq("username", user.username);
    }
    return data.data;
}


export async function DB_SB_get_rooms_of_user(user) {
    if(user === undefined)
        user = await getUser();

    const data = await supabase.from("rooms").select("*").eq("username", user.username);
    return data.data
}

export async function DB_SB_add_product(product) {
    const user = await getUser();
  
    let box_id = -1;
    if (product.box != "") {
        box_id = await DB_SB_get_id_of_box(product.box);
    }
    let room_id = -1;
    if(product.room != "") {
        room_id = await DB_SB_get_id_of_room(product.room);
    }
    
    let data = {
        name: product.name,
        amount: product.amount,
        username: user.username,
        starred: product.starred
    }

    console.log(data)
    let {data:insertedProduct, error} = await supabase.from('products').insert(data).select()

    console.log(error);

   

    let productId = insertedProduct[0].id;

   let amount = product.amount;


    let { error: mapError } = await supabase
    .from('MappingProduct')
    .insert([
    { product_id: productId, box_id: box_id, room_id: room_id, amount: amount },
    ]);

    if (mapError) {
    console.error("Error mapping product:", mapError);
    }

}

export async function DB_SB_add_box(box) {
    const user = await getUser();
    let room_id = -1;
    if(box.room != "") {
        room_id = await DB_SB_get_id_of_room(box.room);
    }

    let data = {
        name: box.name,
        room_id: room_id,
        username: user.username
    }

    await supabase.from('boxes').insert(data);
}

export async function DB_SB_add_room(room) {
    const user = await getUser();

    let data = {
        name: room.name,
        username: user.username
    }
    await supabase.from('rooms').insert(data);
}



async function DB_SB_get_id_of_box(box_name) {
    const user = await getUser();
    const data = await supabase.from("boxes").select("id").eq("username", user.username).eq("name", box_name);
    return data.data[0].id;
}

async function DB_SB_get_id_of_room(room_name) {
    const user = await getUser();
    const data = await supabase.from("rooms").select("id").eq("username", user.username).eq("name", room_name);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return -1;
    return data.data[0].id;
}

export async function DB_SB_get_room(room_id, user = undefined)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("rooms").select("*").eq("username", user.username).eq("id", room_id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return [];
    return data.data;
}
export async function DB_SB_get_box(box_id, user = undefined)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("boxes").select("*").eq("username", user.username).eq("id", box_id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return [];
    return data.data;
}
export async function DB_SB_get_room_name(id, user=undefined)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("rooms").select("name").eq("username", user.username).eq("id", id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return "";
    return data.data[0].name;
}

export async function DB_SB_get_name_of_room_of_box(box)
{
    const user = await getUser();
    const data = await supabase.from("boxes").select("*").eq("username", user.username).eq("name", box);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0) {
        return "";
    }

    return await DB_SB_get_room_name(data.data[0].room_id);
}

export async function DB_SB_get_room_of_box(box, user = undefined)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("boxes").select("*").eq("username", user.username).eq("id", box);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0) {
        return "";
    }

    return await DB_SB_get_room(data.data[0].room_id);
}

export async function DB_SB_get_box_name(id, user=undefined) {
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("boxes").select("name").eq("username", user.username).eq("id", id);
    if (data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return "";
    return data.data[0].name;
}

export async function DB_SB_update_room_name(id, name)
{
    const user = await getUser();
    const {error} = await supabase.from("rooms").update({name: name}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_get_room_createdat(id)
{
    const user = await getUser();
    const data = await supabase.from("rooms").select("creation_date").eq("username", user.username).eq("id", id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return "";

    let date = new Date(data.data[0].creation_date);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export async function DB_SB_get_box_createdat(id, user)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("boxes").select("creation_date").eq("username", user.username).eq("id", id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return "";

    let date = new Date(data.data[0].creation_date);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export async function DB_SB_update_box_name(id, name)
{
    const user = await getUser();
    const {error} = await supabase.from("boxes").update({name: name}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_update_box_room(id, name)
{
    const user = await getUser();
    let room_id = await DB_SB_get_id_of_room(name);
    if(room_id === -1)
        return false;

    const {error} = await supabase.from("boxes").update({room_id: room_id}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_update_product_box(id, box_id)
{
    const user = await getUser();
    const {error} = await supabase.from("products").update({box_id: box_id, room_id: -1}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_update_product_room(id, room_id)
{
    const user = await getUser();
    const {error} = await supabase.from("products").update({box_id: -1, room_id: room_id}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}
export async function DB_SB_get_product_createdat(id, user)
{
    if(user === undefined)
        user = await getUser();
    const data = await supabase.from("products").select("creation_date").eq("username", user.username).eq("id", id);
    if(data === undefined || data == null || data.data === undefined || data.data == null || data.data.length === 0)
        return "";

    let date = new Date(data.data[0].creation_date);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export async function DB_SB_update_product_amount(id, amount)
{
    const user = await getUser();
    const {error} = await supabase.from("products").update({amount: amount}).eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_delete_product(id)
{
    const user = await getUser();
    const {error} = await supabase.from("products").delete().eq("username", user.username).eq('id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }
    return true;
}

export async function DB_SB_delete_room(id)
{
    const user = await getUser();


    let {error} = await supabase.from("products").update({room_id: -1}).eq("username", user.username).eq('room_id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }

    let {error2} = await supabase.from("boxes").update({room_id: -1}).eq("username", user.username).eq('room_id', id);
    if (error2) {
        console.log("Error :", error.message);
        return false;
    }
    await supabase.from("rooms").delete().eq("username", user.username).eq('id', id);
    return true;
}
export async function DB_SB_delete_box(id)
{
    const user = await getUser();


    let {error} = await supabase.from("products").update({box_id: -1}).eq("username", user.username).eq('box_id', id);
    if (error) {
        console.log("Error :", error.message);
        return false;
    }

    await supabase.from("boxes").delete().eq("username", user.username).eq('id', id);
    return true;
}

