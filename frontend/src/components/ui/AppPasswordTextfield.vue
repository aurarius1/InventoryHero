<script setup lang="ts">

type rule = ((value: string) => string | boolean) | boolean | string

const {t: $t} = useI18n()

const password = defineModel<string>()

const {rules=[], disableMinLength=false} = defineProps<{
  rules?: Array<rule>,
  disableMinLength?: boolean
}>()

const visible = ref(false)
const minCharacters = (value?: string) => (value?.length ?? 0) >= 8 || $t('rules.min_password_length')

const passwordRules = computed(() => {
  if(disableMinLength){
    return [...rules]
  }
  return [...rules, minCharacters]
})

const innerIcon = computed(() => {
  if(!visible.value){
    return 'mdi-eye-off'
  }
  return 'mdi-eye'
})

function showPassword(){
  visible.value = !visible.value
}
</script>

<template>
  <v-text-field
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      v-model="password"
      hide-details="auto"
      :rules="passwordRules"

  >
    <template v-slot:append-inner>
      <v-icon @click="showPassword()"  :icon="innerIcon"/>
    </template>
  </v-text-field>
</template>

<style scoped lang="scss">

</style>