import { StoreService, StoreSubscriber } from "../../../store.service"
import { IRootScopeService } from "angular"
import { IsWhiteBackgroundActions } from "./isWhiteBackground.actions"
import { isActionOfType } from "../../../../util/reduxHelper"

export interface IsWhiteBackgroundSubscriber {
	onIsWhiteBackgroundChanged(isWhiteBackground: boolean)
}

export class IsWhiteBackgroundService implements StoreSubscriber {
	private static IS_WHITE_BACKGROUND_CHANGED_EVENT = "is-white-background-changed"

	constructor(private $rootScope: IRootScopeService, private storeService: StoreService) {
		StoreService.subscribe(this.$rootScope, this)
	}

	public onStoreChanged(actionType: string) {
		if (isActionOfType(actionType, IsWhiteBackgroundActions)) {
			this.notify(this.select())
		}
	}

	private select() {
		return this.storeService.getState().appSettings.isWhiteBackground
	}

	private notify(newState: boolean) {
		this.$rootScope.$broadcast(IsWhiteBackgroundService.IS_WHITE_BACKGROUND_CHANGED_EVENT, { isWhiteBackground: newState })
	}

	public static subscribe($rootScope: IRootScopeService, subscriber: IsWhiteBackgroundSubscriber) {
		$rootScope.$on(IsWhiteBackgroundService.IS_WHITE_BACKGROUND_CHANGED_EVENT, (event, data) => {
			subscriber.onIsWhiteBackgroundChanged(data.isWhiteBackground)
		})
	}
}
