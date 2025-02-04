import _ from "lodash"
import { AttributeTypes } from "../../../../codeCharta.model"

export function getMergedAttributeTypes(allAttributeTypes: AttributeTypes[]): AttributeTypes {
	const attributeTypesNodes = []
	const attributeTypesEdges = []

	if (allAttributeTypes.length == 1) {
		return { nodes: [], edges: [] }
	}

	for (let attributeTypes of allAttributeTypes) {
		for (let i = 0; i < attributeTypes.nodes.length; i++) {
			const key = _.findKey(attributeTypes.nodes[i])
			if (!attributeTypesNodes.some(x => _.findKey(x) === key)) {
				attributeTypesNodes.push({ [key]: attributeTypes.nodes[i][key] })
			}
		}

		for (let i = 0; i < attributeTypes.edges.length; i++) {
			const key = _.findKey(attributeTypes.edges[i])
			if (!attributeTypesEdges.some(x => _.findKey(x) === key)) {
				attributeTypesEdges.push({ [key]: attributeTypes.edges[i][key] })
			}
		}
	}

	return {
		nodes: attributeTypesNodes,
		edges: attributeTypesEdges
	}
}
