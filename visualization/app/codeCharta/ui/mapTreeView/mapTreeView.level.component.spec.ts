import "./mapTreeView.module"

import { MapTreeViewLevelController } from "./mapTreeView.level.component"
import { CodeMapHelper } from "../../util/codeMapHelper"
import { IRootScopeService } from "angular"
import { instantiateModule, getService } from "../../../../mocks/ng.mockhelper"
import { CodeMapBuilding } from "../codeMap/rendering/codeMapBuilding"
import { CodeMapNode, BlacklistType, MarkedPackage, NodeType } from "../../codeCharta.model"
import {
	VALID_NODE_WITH_PATH,
	CODE_MAP_BUILDING,
	VALID_NODE_WITH_METRICS,
	VALID_NODE_WITH_ROOT_UNARY,
	withMockedEventMethods
} from "../../util/dataMocks"
import _ from "lodash"
import { CodeMapPreRenderService } from "../codeMap/codeMap.preRender.service"
import { StoreService } from "../../state/store.service"
import { setMarkedPackages } from "../../state/store/fileSettings/markedPackages/markedPackages.actions"
import { setSearchedNodePaths } from "../../state/store/dynamicSettings/searchedNodePaths/searchedNodePaths.actions"
import { setBlacklist } from "../../state/store/fileSettings/blacklist/blacklist.actions"

describe("MapTreeViewLevelController", () => {
	let mapTreeViewLevelController: MapTreeViewLevelController
	let $rootScope: IRootScopeService
	let codeMapPreRenderService: CodeMapPreRenderService
	let storeService: StoreService
	let $event

	beforeEach(() => {
		restartSystem()
		withMockedCodeMapPreRenderService()
		rebuildController()
		withMockedEventMethods($rootScope)
	})

	function restartSystem() {
		instantiateModule("app.codeCharta.ui.mapTreeView")

		$rootScope = getService<IRootScopeService>("$rootScope")
		codeMapPreRenderService = getService<CodeMapPreRenderService>("codeMapPreRenderService")
		storeService = getService<StoreService>("storeService")

		$event = {
			clientX: jest.fn(),
			clientY: jest.fn()
		}
	}

	function rebuildController() {
		mapTreeViewLevelController = new MapTreeViewLevelController($rootScope, codeMapPreRenderService, storeService)
	}

	function withMockedCodeMapPreRenderService() {
		codeMapPreRenderService = jest.fn<CodeMapPreRenderService>(() => {
			return {
				getRenderMap: jest.fn().mockReturnValue(VALID_NODE_WITH_ROOT_UNARY)
			}
		})()
	}

	describe("onBuildingHovered", () => {
		let codeMapBuilding: CodeMapBuilding
		let codeMapNode: CodeMapNode

		beforeEach(() => {
			codeMapBuilding = _.cloneDeep(CODE_MAP_BUILDING)
			codeMapBuilding.node.path = "somePath"

			codeMapNode = _.cloneDeep(VALID_NODE_WITH_PATH)
			codeMapNode.path = "somePath"
		})

		it("should set _isHoveredInCodeMap to true if hovered node path from the event is the same as the node path assigned to this controller", () => {
			mapTreeViewLevelController["node"] = codeMapNode

			mapTreeViewLevelController.onBuildingHovered(codeMapBuilding)

			expect(mapTreeViewLevelController["_viewModel"].isHoveredInCodeMap).toBe(true)
		})

		it("should set _isHoveredInCodeMap to false if hovered node path from the event is not the same as the node path assigned to this controller", () => {
			const differentCodeMapBuilding = _.cloneDeep(CODE_MAP_BUILDING)
			differentCodeMapBuilding.node.path = "someOtherPath"
			mapTreeViewLevelController["node"] = codeMapNode

			mapTreeViewLevelController.onBuildingHovered(differentCodeMapBuilding)

			expect(mapTreeViewLevelController["_viewModel"].isHoveredInCodeMap).toBe(false)
		})

		it("should set _isHoveredInCodeMap to false if unhovered", () => {
			mapTreeViewLevelController.onBuildingUnhovered()

			expect(mapTreeViewLevelController["_viewModel"].isHoveredInCodeMap).toBe(false)
		})
	})

	describe("getMarkingColor", () => {
		it("should return black color if no folder", () => {
			mapTreeViewLevelController["node"] = { path: "/root/node/path", type: NodeType.FILE } as CodeMapNode

			const result = mapTreeViewLevelController.getMarkingColor()

			expect(result).toBe("#000000")
		})

		it("should return the markingColor if the matching markedPackage", () => {
			mapTreeViewLevelController["node"] = { path: "/root/node/path", type: NodeType.FOLDER } as CodeMapNode
			const markedMackages = [
				{
					path: "/root/node/path",
					color: "#123FDE"
				} as MarkedPackage
			]
			storeService.dispatch(setMarkedPackages(markedMackages))

			const result = mapTreeViewLevelController.getMarkingColor()

			expect(result).toBe("#123FDE")
		})

		it("should return black if no markingColor in node", () => {
			mapTreeViewLevelController["node"] = { path: "/root/node/path", type: NodeType.FOLDER } as CodeMapNode
			storeService.dispatch(setMarkedPackages([]))

			const result = mapTreeViewLevelController.getMarkingColor()

			expect(result).toBe("#000000")
		})
	})

	describe("onMouseEnter", () => {
		it("should broadcast should-hover-node", () => {
			mapTreeViewLevelController.onMouseEnter()

			expect($rootScope.$broadcast).toHaveBeenCalledWith("should-hover-node", mapTreeViewLevelController["node"])
		})
	})

	describe("onMouseLeave", () => {
		it("should broadcast should-unhover-node", () => {
			mapTreeViewLevelController.onMouseLeave()

			expect($rootScope.$broadcast).toHaveBeenCalledWith("should-unhover-node", mapTreeViewLevelController["node"])
		})
	})

	describe("onRightClick", () => {
		it("should broadcast node context menu events", () => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)
			let context = {
				path: mapTreeViewLevelController["node"].path,
				type: mapTreeViewLevelController["node"].type,
				x: $event.clientX,
				y: $event.clientY
			}

			mapTreeViewLevelController.onRightClick($event)

			expect($rootScope.$broadcast).toHaveBeenCalledWith("show-node-context-menu", context)
		})
	})

	describe("onFolderClick", () => {
		it("should open subfolder", () => {
			mapTreeViewLevelController["_viewModel"].collapsed = true

			mapTreeViewLevelController.onFolderClick()

			expect(mapTreeViewLevelController["_viewModel"].collapsed).toBeFalsy()
		})

		it("should collapse subfolder", () => {
			mapTreeViewLevelController["_viewModel"].collapsed = false

			mapTreeViewLevelController.onFolderClick()

			expect(mapTreeViewLevelController["_viewModel"].collapsed).toBeTruthy()
		})
	})

	describe("onLabelClick", () => {
		it("should set new focused path", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_PATH.children[1]
			mapTreeViewLevelController.onLabelClick()

			expect(storeService.getState().dynamicSettings.focusedNodePath).toEqual(VALID_NODE_WITH_PATH.children[1].path)
		})
	})

	describe("onEyeClick", () => {
		beforeEach(() => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)
		})

		it("should add flattened blacklistItem", () => {
			storeService.dispatch(setBlacklist([]))
			mapTreeViewLevelController["node"].visible = true

			mapTreeViewLevelController.onEyeClick()

			expect(storeService.getState().fileSettings.blacklist).toContainEqual({
				path: "/root/Parent Leaf",
				type: BlacklistType.flatten
			})
		})

		it("should remove flattened blacklistItem", () => {
			storeService.dispatch(setBlacklist([{ path: "/root/Parent Leaf", type: BlacklistType.flatten }]))
			mapTreeViewLevelController["node"].visible = false

			mapTreeViewLevelController.onEyeClick()

			expect(storeService.getState().fileSettings.blacklist).not.toContainEqual({
				path: "/root/Parent Leaf",
				type: BlacklistType.flatten
			})
		})
	})

	describe("isLeaf", () => {
		it("should be a leaf", () => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf/small leaf",
				NodeType.FILE,
				VALID_NODE_WITH_PATH
			)

			expect(mapTreeViewLevelController.isLeaf()).toBeTruthy()
		})

		it("should not be a leaf", () => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)

			const result = mapTreeViewLevelController.isLeaf(mapTreeViewLevelController["node"])

			expect(result).toBeFalsy()
		})
	})

	describe("isBlacklisted", () => {
		it("should call CodeMapHelper.isBlacklisted", () => {
			CodeMapHelper.isBlacklisted = jest.fn()

			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf/empty folder",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)

			mapTreeViewLevelController.isBlacklisted(mapTreeViewLevelController["node"])

			expect(CodeMapHelper.isBlacklisted).toHaveBeenCalledWith(
				mapTreeViewLevelController["node"],
				storeService.getState().fileSettings.blacklist,
				BlacklistType.exclude
			)
		})

		it("should not be blacklisted", () => {
			CodeMapHelper.isBlacklisted = jest.fn()

			const result = mapTreeViewLevelController.isBlacklisted(mapTreeViewLevelController["node"])

			expect(result).toBeFalsy()
		})
	})

	describe("isSearched", () => {
		it("should be searched", () => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf/empty folder",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)
			storeService.dispatch(setSearchedNodePaths(["/root/Parent Leaf/", "/root/Parent Leaf/empty folder"]))

			const result = mapTreeViewLevelController.isSearched(mapTreeViewLevelController["node"])

			expect(result).toBeTruthy()
		})

		it("should not be searched", () => {
			mapTreeViewLevelController["node"] = CodeMapHelper.getCodeMapNodeFromPath(
				"/root/Parent Leaf/empty folder",
				NodeType.FOLDER,
				VALID_NODE_WITH_PATH
			)
			storeService.dispatch(setSearchedNodePaths(["/root/Parent Leaf"]))

			const result = mapTreeViewLevelController.isSearched(mapTreeViewLevelController["node"])

			expect(result).toBeFalsy()
		})

		it("should not be searched with null parameter", () => {
			const result = mapTreeViewLevelController.isSearched(null)

			expect(result).toBeFalsy()
		})
	})

	describe("openRootFolderByDefault", () => {
		it("should set the collapsed variable to false, if depth size is 0", () => {
			mapTreeViewLevelController["_viewModel"].collapsed = true

			mapTreeViewLevelController.openRootFolderByDefault(0)

			expect(mapTreeViewLevelController["_viewModel"].collapsed).toBeFalsy()
		})
		it("should do nothing, if the depth size is not 0", () => {
			mapTreeViewLevelController["_viewModel"].collapsed = true

			mapTreeViewLevelController.openRootFolderByDefault(5)

			expect(mapTreeViewLevelController["_viewModel"].collapsed).toBeTruthy()
		})
		it("should do nothing, if the depth size is not 0 and the collapsed variable is false", () => {
			mapTreeViewLevelController["_viewModel"].collapsed = false

			mapTreeViewLevelController.openRootFolderByDefault(5)

			expect(mapTreeViewLevelController["_viewModel"].collapsed).toBeFalsy()
		})
	})

	describe("getNodeUnaryValue", () => {
		it("should return the unary of the current node", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_METRICS

			const result = mapTreeViewLevelController.getNodeUnaryValue()

			expect(result).toBe(VALID_NODE_WITH_METRICS.attributes["unary"])
		})
	})

	describe("getUnaryPercentage", () => {
		it("should return the Child Node Unary-Percentage to 50 percent", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_ROOT_UNARY.children[0]

			const result = mapTreeViewLevelController.getUnaryPercentage()

			expect(result).toBe("50")
		})
		it("should return the Root-Node Unary-Precentage to 100 percent", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_ROOT_UNARY

			const result = mapTreeViewLevelController.getUnaryPercentage()

			expect(result).toBe("100")
		})
	})

	describe("isRoot", () => {
		it("should return that the current Node is a Root", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_ROOT_UNARY

			const result = mapTreeViewLevelController.isRoot()

			expect(result).toBeTruthy()
		})
		it("should return that the current Node is not Root", () => {
			mapTreeViewLevelController["node"] = VALID_NODE_WITH_ROOT_UNARY.children[0]

			const result = mapTreeViewLevelController.isRoot()

			expect(result).toBeFalsy()
		})
	})
})
