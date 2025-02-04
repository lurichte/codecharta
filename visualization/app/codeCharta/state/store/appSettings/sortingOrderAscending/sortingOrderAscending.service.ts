import { StoreService, StoreSubscriber } from "../../../store.service"
import { IRootScopeService } from "angular"
import { SortingOrderAscendingActions } from "./sortingOrderAscending.actions"
import _ from "lodash"
import { isActionOfType } from "../../../../util/reduxHelper"

export interface SortingOrderAscendingSubscriber {
	onSortingOrderAscendingChanged(sortingOrderAscending: boolean)
}

export class SortingOrderAscendingService implements StoreSubscriber {
	private static SORTING_ORDER_ASCENDING_CHANGED_EVENT = "sorting-order-ascending-changed"

	constructor(private $rootScope: IRootScopeService, private storeService: StoreService) {
		StoreService.subscribe(this.$rootScope, this)
	}

	public onStoreChanged(actionType: string) {
		if (isActionOfType(actionType, SortingOrderAscendingActions)) {
			this.notify(this.select())
		}
	}

	private select() {
		return this.storeService.getState().appSettings.sortingOrderAscending
	}

	private notify(newState: boolean) {
		this.$rootScope.$broadcast(SortingOrderAscendingService.SORTING_ORDER_ASCENDING_CHANGED_EVENT, { sortingOrderAscending: newState })
	}

	public static subscribe($rootScope: IRootScopeService, subscriber: SortingOrderAscendingSubscriber) {
		$rootScope.$on(SortingOrderAscendingService.SORTING_ORDER_ASCENDING_CHANGED_EVENT, (event, data) => {
			subscriber.onSortingOrderAscendingChanged(data.sortingOrderAscending)
		})
	}
}
