<template>
  <div class="platform-icon" :class="platform">
    <i v-if="platform === 'facebook'" class="fab fa-facebook"></i>
    <i v-else-if="platform === 'instagram'" class="fab fa-instagram"></i>
    <i v-else-if="platform === 'line'" class="fab fa-line"></i>
    <span v-if="showName" class="platform-name">{{ platform }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  platform: 'facebook' | 'instagram' | 'line'
  showName?: boolean
}

withDefaults(defineProps<Props>(), {
  showName: true
})
</script>

<style scoped>
.platform-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 16px;
}

.platform-icon.facebook {
  background-color: #f5f9ff;
  color: #1877f2;
}

.platform-icon.instagram {
  background: linear-gradient(45deg, #f9f0ff, #fff0f6);
  color: #e4405f;
}

.platform-icon.line {
  background-color: #e9f7e9;
  color: #00b900;
}

.platform-icon i {
  font-size: 20px;
}

.platform-name {
  font-size: 14px;
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .platform-icon {
    padding: 4px 8px;
  }
  
  .platform-icon i {
    font-size: 18px;
  }
  
  .platform-name {
    font-size: 12px;
  }
}
</style> 