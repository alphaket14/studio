<template>

  <div>
    <!-- Filters -->
    <SearchFilterBar />
    <VLayout row>
      <VFlex shrink>
        <div class="px-2">
          <ActionLink
            class="mb-3"
            :text="$tr('savedSearchesLabel')"
            @click="showSavedSearches = true"
          />
        </div>
        <SearchFilters
          :searchResults="nodes"
        />
      </VFlex>

      <!-- Main area with cards -->
      <VFlex class="pl-4">
        <VContainer v-if="loadFailed">
          <p class="text-xs-center">
            <Icon color="red">
              error
            </Icon>
          </p>
          <p class="text-xs-center">
            {{ $tr('failedToLoad') }}
          </p>
        </VContainer>
        <VContainer v-else class="mx-0 px-1">
          <LoadingText v-if="loading" />
          <VLayout v-else row align-center>
            <VFlex grow>
              <span class="font-weight-bold subheading">
                {{ $tr('searchResultsCount', {
                  count: totalCount,
                  searchTerm: currentSearchTerm })
                }}
              </span>
              <ActionLink
                class="mx-2"
                :text="$tr('saveSearchAction')"
                @click="handleClickSaveSearch"
              />
            </VFlex>
            <VFlex v-if="searchIsNotEmpty" style="max-width: 100px;">
              <span>
                <VSelect
                  v-model="pageSize"
                  :label="$tr('resultsPerPageLabel')"
                  :items="pageSizeOptions"
                  :fullWidth="false"
                  :menu-props="{ offsetY: true }"
                />
              </span>
            </VFlex>
          </VLayout>
          <div>
            <VLayout v-for="node in nodes" :key="node.id" row align-center class="py-2">
              <VFlex class="px-1" shrink>
                <Checkbox
                  :key="`checkbox-${node.id}`"
                  :input-value="isSelected(node)"
                  class="mt-0 pt-0"
                  @change="toggleSelected(node)"
                />
              </VFlex>
              <VFlex shrink grow style="width: 100%;">
                <BrowsingCard
                  :node="node"
                  :inSearch="true"
                  @preview="$emit('preview', node)"
                  @click="toggleSelected(node)"
                  @copy_to_clipboard="$emit('copy_to_clipboard', node)"
                />
              </VFlex>
            </VLayout>
            <div v-if="pageCount > 1" class="mt-4 text-xs-center">
              <Pagination :totalPages="pageCount" />
            </div>
          </div>
        </VContainer>
      </VFlex>
    </VLayout>
    <SavedSearchesModal v-model="showSavedSearches" />
  </div>

</template>

<script>

  import { mapActions, mapGetters, mapState } from 'vuex';
  import debounce from 'lodash/debounce';
  import find from 'lodash/find';
  import BrowsingCard from './BrowsingCard';
  import SavedSearchesModal from './SavedSearchesModal';
  import SearchFilters from './SearchFilters';
  import SearchFilterBar from './SearchFilterBar';
  import Pagination from 'shared/views/Pagination';
  import Checkbox from 'shared/views/form/Checkbox';
  import LoadingText from 'shared/views/LoadingText';
  import { constantsTranslationMixin } from 'shared/mixins';

  export default {
    name: 'SearchResultsList',
    components: {
      BrowsingCard,
      Pagination,
      SavedSearchesModal,
      SearchFilters,
      SearchFilterBar,
      Checkbox,
      LoadingText,
    },
    mixins: [constantsTranslationMixin],
    props: {
      selected: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        loading: false,
        loadFailed: false,
        showSavedSearches: false,
        nodeIds: [],
        pageCount: 0,
        totalCount: 0,
      };
    },
    computed: {
      ...mapGetters('contentNode', ['getContentNodes']),
      ...mapState('currentChannel', ['currentChannelId']),
      nodes() {
        return this.getContentNodes(this.nodeIds) || [];
      },
      pageSize: {
        get() {
          return Number(this.$route.query.page_size) || 25;
        },
        set(page_size) {
          this.$router.push({
            ...this.$route,
            query: {
              ...this.$route.query,
              page: 1,
              page_size,
            },
          });
        },
      },
      pageSizeOptions() {
        return [25, 50, 100];
      },
      isSelected() {
        return function(node) {
          return Boolean(find(this.selected, { id: node.id }));
        };
      },
      currentSearchTerm() {
        return this.$route.params.searchTerm;
      },
      searchIsNotEmpty() {
        return this.nodes.length > 0;
      },
    },
    watch: {
      '$route.query'() {
        this.fetch();
      },
    },
    beforeRouteUpdate(to, from, next) {
      this.showSavedSearches = false;
      next();
    },
    mounted() {
      this.fetch();
    },
    methods: {
      ...mapActions('importFromChannels', ['fetchResourceSearchResults', 'createSearch']),
      fetch() {
        this.loading = true;
        this.loadFailed = false;
        this.fetchResultsDebounced();
      },
      fetchResultsDebounced: debounce(
        function() {
          this.fetchResourceSearchResults({
            ...this.$route.query,
            keywords: this.currentSearchTerm,
            exclude_channel: this.currentChannelId,
            last: undefined,
          })
            .then(page => {
              this.loading = false;
              this.nodeIds = page.results.map(n => n.id);
              this.pageCount = page.total_pages;
              this.totalCount = page.count;
            })
            .catch(() => {
              this.loadFailed = true;
            });
        },
        1000,
        { trailing: true }
      ),
      handleClickSaveSearch() {
        let params = { ...this.$route.query };
        delete params.last;
        delete params.page_size;
        delete params.page;

        this.createSearch({
          ...params,
          keywords: this.$route.params.searchTerm,
        }).then(() => {
          this.$store.dispatch('showSnackbarSimple', this.$tr('searchSavedSnackbar'));
        });
      },
      toggleSelected(node) {
        this.$emit('change_selected', { nodes: [node], isSelected: !this.isSelected(node) });
      },
    },
    $trs: {
      searchResultsCount:
        "{count, number} {count, plural, one {result} other {results}} for '{searchTerm}'",
      resultsPerPageLabel: 'Results per page',
      saveSearchAction: 'Save search',
      savedSearchesLabel: 'View saved searches',
      searchSavedSnackbar: 'Search saved',
      failedToLoad: 'Failed to load search results',
    },
  };

</script>


<style lang="less" scoped></style>
