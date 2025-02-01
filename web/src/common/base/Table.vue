<template>
  <div class="table-container">
    <table class="base-table">
      <thead>
        <tr>
          <th 
            v-for="column in columns" 
            :key="column.key"
            :class="{ 
              sortable: column.sortable,
              sorted: sortKey === column.key,
              ascending: sortKey === column.key && sortOrder === 'asc'
            }"
            @click="handleSort(column)"
          >
            {{ column.title }}
            <i 
              v-if="column.sortable" 
              class="fas fa-sort"
              :class="{
                'fa-sort-up': sortKey === column.key && sortOrder === 'asc',
                'fa-sort-down': sortKey === column.key && sortOrder === 'desc'
              }"
            ></i>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="loading">
            <slot name="loading">
              <div class="loading-content">載入中...</div>
            </slot>
          </td>
        </tr>
        <template v-else-if="data.length > 0">
          <tr v-for="(row, index) in sortedData" :key="row[rowKey] || index">
            <td v-for="column in columns" :key="column.key">
              <slot :name="column.key" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length" class="no-data">
            <slot name="empty">
              <div class="empty-content">暫無數據</div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Column {
  key: string
  title: string
  sortable?: boolean
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id'
})

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const handleSort = (column: Column) => {
  if (!column.sortable) return
  
  if (sortKey.value === column.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = column.key
    sortOrder.value = 'asc'
  }
}

const sortedData = computed(() => {
  if (!sortKey.value) return props.data
  
  return [...props.data].sort((a, b) => {
    const aValue = a[sortKey.value]
    const bValue = b[sortKey.value]
    
    if (aValue === bValue) return 0
    
    const result = aValue > bValue ? 1 : -1
    return sortOrder.value === 'asc' ? result : -result
  })
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.table-container {
  @include card;
  overflow: hidden;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: $spacing-lg;
    text-align: left;
    border-bottom: 1px solid $border-color;
    font-size: $font-size-base;
    
    &:last-child {
      padding-right: $spacing-xl;
      text-align: left;
    }
  }
  
  th {
    background: $background-light;
    font-weight: 600;
    color: $text-primary;
    user-select: none;
    white-space: nowrap;
    
    &.sortable {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: darken($background-light, 2%);
      }
      
      i {
        margin-left: $spacing-sm;
        color: $text-secondary;
        font-size: $font-size-sm;
      }
      
      &.sorted i {
        color: $primary-color;
      }
    }
  }
  
  td {
    color: $text-primary;
    
    .post-title {
      @include flex-col($spacing-xs);
      
      .title-text {
        font-weight: 500;
        color: $text-primary;
      }
      
      .post-date {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
    
    .actions {
      @include flex-row($spacing-sm);
      justify-content: flex-start;
      
      :deep(.base-button) {
        min-width: 64px;
      }
    }
  }
  
  tbody {
    tr {
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba($background-light, 0.5);
      }
    }
  }
}

.loading-content,
.empty-content {
  padding: $spacing-xl;
  text-align: center;
  color: $text-secondary;
  font-size: $font-size-base;
}

@include mobile {
  .base-table {
    th, td {
      padding: $spacing-md;
      font-size: $font-size-sm;
      
      &:not(:first-child):not(:last-child) {
        display: none;
      }
    }
    
    td {
      .post-title {
        .title-text {
          @include text-truncate;
          max-width: 200px;
        }
      }
    }
  }
}
</style> 