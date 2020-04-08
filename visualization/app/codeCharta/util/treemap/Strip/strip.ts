import { CodeMapNode } from "../../../codeCharta.model"
import Rectangle from "../../rectangle"
import { StreetLayoutValuedCodeMapNode } from "../../streetLayoutGenerator"
import { StreetLayoutHelper } from "../../streetLayoutHelper"

export default abstract class Strip {
	public nodes: CodeMapNode[] = []

	constructor(nodes: CodeMapNode[]) {
		this.nodes = nodes
	}

	public abstract layout(
		rect: Rectangle,
		rootSize: number,
		metricName: string,
		currentTreemapDepth: number,
		order?: Number
	): StreetLayoutValuedCodeMapNode[]

	public abstract worstAspectRatio(nodes: CodeMapNode[], rect: Rectangle, rootSize: number, metricName: string): number

	public totalScaledSize(nodes: CodeMapNode[], metricName: string, rootSize: number, rootArea: number): number {
		return nodes.reduce((total, n) => total + this.scaledSize(n, rootSize, rootArea, metricName), 0)
	}

	public totalSize(metricName: string) {
		return this.nodes.reduce((total, n) => total + StreetLayoutHelper.calculateSize(n, metricName), 0)
	}

	protected min(nodes: CodeMapNode[], metricName: string, rootSize: number, rootArea: number): number {
		return nodes.reduce((min, n) => Math.min(min, this.scaledSize(n, rootSize, rootArea, metricName)), Number.MAX_VALUE)
	}

	protected max(nodes: CodeMapNode[], metricName: string, rootSize: number, rootArea: number): number {
		return nodes.reduce((max, n) => Math.max(max, this.scaledSize(n, rootSize, rootArea, metricName)), Number.MIN_VALUE)
	}

	public populate(nodes: CodeMapNode[], rect: Rectangle, rootSize: number, metricName: string) {
		for (let node of nodes) {
			const score = this.worstAspectRatio(this.nodes, rect, rootSize, metricName)
			const newScore = this.worstAspectRatio(this.nodes.concat(node), rect, rootSize, metricName)

			if (newScore < score) {
				this.nodes.push(node)
			} else {
				/* Node would increase worst aspect ratio, strip is completed */
				break
			}
		}
	}

	protected scaledSize(node: CodeMapNode, parentSize: number, parentArea: number, metricName: string): number {
		const size = StreetLayoutHelper.calculateSize(node, metricName)
		const scale = parentArea / parentSize
		return scale * size
	}
}
