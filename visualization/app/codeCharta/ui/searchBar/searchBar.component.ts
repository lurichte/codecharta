import "./searchBar.component.scss"
import { BlacklistType, BlacklistItem, CodeMapNode } from "../../codeCharta.model"
import { IRootScopeService } from "angular"
import { StoreService } from "../../state/store.service"
import { setSearchPattern } from "../../state/store/dynamicSettings/searchPattern/searchPattern.actions"
import _ from "lodash"
import { BlacklistService, BlacklistSubscriber } from "../../state/store/fileSettings/blacklist/blacklist.service"
import { addBlacklistItem } from "../../state/store/fileSettings/blacklist/blacklist.actions"
import { SearchPatternService, SearchPatternSubscriber } from "../../state/store/dynamicSettings/searchPattern/searchPattern.service"
import * as d3 from "d3"
import { blacklistNode } from "../../state/store/files/files.actions"
import { CodeMapHelper } from "../../util/codeMapHelper"
import ignore from "ignore"

export class SearchBarController implements BlacklistSubscriber, SearchPatternSubscriber {
	private static DEBOUNCE_TIME = 400
	private readonly applyDebouncedSearchPattern: () => void

	private _viewModel: {
		searchPattern: string
		isPatternHidden: boolean
		isPatternExcluded: boolean
	} = {
		searchPattern: "",
		isPatternHidden: true,
		isPatternExcluded: true
	}

	/* @ngInject */
	constructor(private $rootScope: IRootScopeService, private storeService: StoreService) {
		BlacklistService.subscribe(this.$rootScope, this)
		SearchPatternService.subscribe(this.$rootScope, this)
		this.applyDebouncedSearchPattern = _.debounce(() => {
			this.updateSearchPattern()
		}, SearchBarController.DEBOUNCE_TIME)
	}

	public onBlacklistChanged(blacklist: BlacklistItem[]) {
		this.updateViewModel()
	}

	public onSearchPatternChanged(searchPattern: string) {
		this._viewModel.searchPattern = searchPattern
		this.updateViewModel()
	}

	public handleSearchPatternChange() {
		this.applyDebouncedSearchPattern()
	}

	public onClickBlacklistPattern(blacklistType: BlacklistType) {
		this.storeService.dispatch(addBlacklistItem({ path: this._viewModel.searchPattern, type: blacklistType }))

		let allPaths = []
		const ig = ignore().add(CodeMapHelper.transformPath(this._viewModel.searchPattern))

		this.storeService
			.getState()
			.files.getVisibleFileStates()
			.forEach(file => {
				allPaths.push(...d3.hierarchy<CodeMapNode>(file.file.map).leaves())
			})

		allPaths = allPaths.map(file => {
			return CodeMapHelper.transformPath(file.file.map.path)
		})

		allPaths.forEach(file => {
			if (ig.ignores(file.path)) {
				this.storeService.dispatch(blacklistNode(file.path, blacklistType))
			}
		})

		this.resetSearchPattern()
	}

	public isSearchPatternEmpty() {
		return this._viewModel.searchPattern === ""
	}

	private updateViewModel() {
		const blacklist = this.storeService.getState().fileSettings.blacklist
		this._viewModel.isPatternExcluded = this.isPatternBlacklisted(blacklist, BlacklistType.exclude)
		this._viewModel.isPatternHidden = this.isPatternBlacklisted(blacklist, BlacklistType.flatten)
	}

	private isPatternBlacklisted(blacklist: BlacklistItem[], blacklistType: BlacklistType): boolean {
		return !!blacklist.find(x => this._viewModel.searchPattern == x.path && blacklistType == x.type)
	}

	private resetSearchPattern() {
		this._viewModel.searchPattern = ""
		this.updateSearchPattern()
	}

	private updateSearchPattern() {
		this.storeService.dispatch(setSearchPattern(this._viewModel.searchPattern))
	}
}

export const searchBarComponent = {
	selector: "searchBarComponent",
	template: require("./searchBar.component.html"),
	controller: SearchBarController
}
