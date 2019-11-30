// Plop: Append reducer import here
import { markedPackages } from "./markedPackages/markedPackages.reducer"
import { edges } from "./edges/edges.reducer"
import { attributeTypes } from "./attributeTypes/attributeTypes.reducer"
import { blacklist } from "./blacklist/blacklist.reducer"
import { Action } from "redux"
import { setMarkedPackages } from "./markedPackages/markedPackages.actions"
import { setEdges } from "./edges/edges.actions"
import { setAttributeTypes } from "./attributeTypes/attributeTypes.actions"
import { setBlacklist } from "./blacklist/blacklist.actions"
import { FileSettings } from "../../../codeCharta.model"
import { FileSettingsActions } from "./fileSettings.actions"

export function fileSettings(state: FileSettings, action: Action) {
	switch (action.type) {
		case FileSettingsActions.SET_FILE_SETTINGS:
			return {
				markedPackages: markedPackages(state.markedPackages, setMarkedPackages(action.payload.markedPackages)),
				edges: edges(state.edges, setEdges(action.payload.edges)),
				attributeTypes: attributeTypes(state.attributeTypes, setAttributeTypes(action.payload.attributeTypes)),
				blacklist: blacklist(state.blacklist, setBlacklist(action.payload.blacklist))
			}
		default:
			return {
				markedPackages: markedPackages(state.markedPackages, action),
				edges: edges(state.edges, action),
				attributeTypes: attributeTypes(state.attributeTypes, action),
				blacklist: blacklist(state.blacklist, action)
			}
	}
}

export default fileSettings
