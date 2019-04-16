import { CodeMapLabelService } from "./codeMap.label.service"
import { Node } from "./rendering/node"
import { Vector3 } from "three"
import { ThreeOrbitControlsService } from "./threeViewer/threeOrbitControlsService"
import { ThreeCameraService } from "./threeViewer/threeCameraService"
import { ThreeSceneService } from "./threeViewer/threeSceneService"
import { IRootScopeService } from "angular"
import { getService } from "../../../../mocks/ng.mockhelper"
import { SETTINGS } from "../../util/dataMocks"
import { Settings } from "../../codeCharta.model"

describe("CodeMapLabelService", () => {
	let services, codeMapLabelService: CodeMapLabelService
	let createElementOrigin
	let sampleRenderSettings: Settings
	let sampleLeaf: Node
	let canvasCtxMock

	beforeEach(() => {
		setServices()
		withMockedEventMethods()
		withMockedThreeCameraService()
		withMockedThreeSceneService()
		rebuild()
		setCanvasRenderSettings()
	})

	function setServices() {
		services = {
			$rootScope: getService<IRootScopeService>("$rootScope"),
			threeCameraService: new ThreeCameraService(null, null),
			threeSceneService: new ThreeSceneService(),
			threeOrbitControlsService: ThreeOrbitControlsService
		}

		services.threeOrbitControlsService = new ThreeOrbitControlsService(
			services.threeCameraService,
			services.threeSceneService,
			services.$rootScope
		)
	}

	function rebuild() {
		codeMapLabelService = new CodeMapLabelService(services.$rootScope,
			services.threeOrbitControlsService,
			services.threeCameraService,
			services.threeSceneService
		)
	}

	function withMockedEventMethods() {
		services.$rootScope.$on = jest.fn()
		services.$rootScope.$broadcast = jest.fn()
	}

	function withMockedThreeCameraService() {
		services.threeCameraService = jest.fn<ThreeCameraService>(() => {
			return {
				camera: {
					position: {
						distanceTo: jest.fn()
					}
				}
			}
		})()
	}

	function withMockedThreeSceneService() {
		services.threeSceneService = jest.fn<ThreeSceneService>(() => {
			return {
				mapGeometry: jest.fn(),
				labels: {
					add: jest.fn(),
					children: jest.fn()
				}
			}
		})()
	}

	function setCanvasRenderSettings() {
		sampleRenderSettings = SETTINGS

		sampleLeaf = ({
			name: "sample",
			width: 1,
			height: 2,
			length: 3,
			depth: 4,
			x0: 5,
			z0: 6,
			y0: 7,
			isLeaf: true,
			deltas: { a: 1, b: 2 },
			attributes: { a: 20, b: 15, mcc: 99 },
			children: []
		} as undefined) as Node

		canvasCtxMock = {
			font: "",
			measureText: jest.fn(),
			fillRect: jest.fn(),
			fillText: jest.fn(),
			strokeRect: jest.fn()
		}

		createElementOrigin = document.createElement

		document.createElement = jest.fn(() => {
			return {
				getContext: () => {
					return canvasCtxMock
				}
			}
		})

		canvasCtxMock.measureText.mockReturnValue({ width: 10 })
	}

	afterEach(() => {
		document.createElement = createElementOrigin
	})

	it("should have no labels stored after construction", () => {
		expect(codeMapLabelService["labels"].length).toBe(0)
	})

	it("addLabel should add label if node has a height attribute mentioned in renderSettings", () => {
		codeMapLabelService.addLabel(sampleLeaf, sampleRenderSettings)
		expect(codeMapLabelService["labels"].length).toBe(1)
	})

	it("addLabel should not add label if node has not a height attribute mentioned in renderSettings", () => {
		sampleLeaf.attributes = { notsome: 0 }
		codeMapLabelService.addLabel(sampleLeaf, sampleRenderSettings)
		expect(codeMapLabelService["labels"].length).toBe(0)
	})

	it("addLabel should calculate correct height without delta", () => {
		codeMapLabelService.addLabel(sampleLeaf, sampleRenderSettings)
		let positionWithoutDelta: Vector3 = codeMapLabelService["labels"][0].sprite.position
		expect(positionWithoutDelta.y).toBe(93)
	})

	it("clearLabel should clear parent in scene and internal labels", () => {
		codeMapLabelService.clearLabels()
		expect(codeMapLabelService["threeSceneService"].labels.children.length).toBe(0)
		expect(codeMapLabelService["labels"].length).toBe(0)
	})

	it("scaling existing labels should scale their position correctly", () => {
		const SX = 1
		const SY = 2
		const SZ = 3

		codeMapLabelService.addLabel(sampleLeaf, sampleRenderSettings)
		codeMapLabelService.addLabel(sampleLeaf, sampleRenderSettings)

		const scaleBeforeA: Vector3 = new Vector3(
			codeMapLabelService["labels"][0].sprite.position.x,
			codeMapLabelService["labels"][0].sprite.position.y,
			codeMapLabelService["labels"][0].sprite.position.z
		)

		const scaleBeforeB: Vector3 = new Vector3(
			codeMapLabelService["labels"][1].sprite.position.x,
			codeMapLabelService["labels"][1].sprite.position.y,
			codeMapLabelService["labels"][1].sprite.position.z
		)

		codeMapLabelService.scale(SX, SY, SZ)

		const scaleAfterA: Vector3 = codeMapLabelService["labels"][0].sprite.position
		const scaleAfterB: Vector3 = codeMapLabelService["labels"][1].sprite.position

		expect(scaleAfterA.x).toBe(scaleBeforeA.x * SX)
		expect(scaleAfterA.y).toBe(scaleBeforeA.y * SY)
		expect(scaleAfterA.z).toBe(scaleBeforeA.z * SZ)

		expect(scaleAfterB.x).toBe(scaleBeforeB.x * SX)
		expect(scaleAfterB.y).toBe(scaleBeforeB.y * SY)
		expect(scaleAfterB.z).toBe(scaleBeforeB.z * SZ)
	})
})
