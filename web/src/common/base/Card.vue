<template>
  <div class="base-card" :class="[shadow && 'has-shadow', { hoverable }]">
    <div v-if="$slots.header || title" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header"></slot>
    </div>
    
    <div class="card-body">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  shadow?: boolean
  hoverable?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  shadow: true,
  hoverable: false
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.base-card {
  background: white;
  border-radius: $radius-lg;
  border: 1px solid $border-color;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.has-shadow {
    box-shadow: $shadow-base;
  }
  
  &.hoverable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
  }
}

.card-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
  @include flex-row;
  justify-content: space-between;
  align-items: center;
  
  .card-title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: 500;
    color: $text-primary;
  }
}

.card-body {
  padding: $spacing-lg;
}

.card-footer {
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  background: $background-light;
}

@include mobile {
  .base-card {
    border-radius: $radius-base;
  }
  
  .card-header {
    padding: $spacing-md;
  }
  
  .card-body {
    padding: $spacing-md;
  }
  
  .card-footer {
    padding: $spacing-md;
  }
}
</style> 