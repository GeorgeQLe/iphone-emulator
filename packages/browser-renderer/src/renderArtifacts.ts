import type {
  RendererRenderArtifactMetadata,
  RendererViewportMetadata,
  SemanticUITree,
  UITreeNode,
} from "./types";

const DEFAULT_RENDER_VIEWPORT: RendererViewportMetadata = {
  width: 390,
  height: 844,
  scale: 1,
};

export interface CreateRenderArtifactMetadataOptions {
  name?: string;
  viewport?: Partial<RendererViewportMetadata>;
}

export function createRenderArtifactMetadata(
  tree: SemanticUITree,
  options: CreateRenderArtifactMetadataOptions = {}
): RendererRenderArtifactMetadata {
  const viewport = {
    ...DEFAULT_RENDER_VIEWPORT,
    ...options.viewport,
  };
  const metadataPayload = {
    appIdentifier: tree.appIdentifier,
    sceneId: tree.scene.id,
    sceneKind: tree.scene.kind,
    rootNodeId: tree.scene.rootNode?.id,
    nodeCount: countSceneNodes(tree),
    viewport,
  };

  return {
    name: options.name ?? `${tree.appIdentifier}-${tree.scene.id}-render`,
    kind: "render",
    format: "dom",
    byteCount: new TextEncoder().encode(JSON.stringify(metadataPayload)).byteLength,
    ...metadataPayload,
  };
}

function countSceneNodes(tree: SemanticUITree): number {
  const rootCount = tree.scene.rootNode ? countNode(tree.scene.rootNode) : 0;
  const modalCount = tree.scene.modalState?.presentedNode
    ? countNode(tree.scene.modalState.presentedNode)
    : 0;
  return rootCount + modalCount;
}

function countNode(node: UITreeNode): number {
  return 1 + node.children.reduce((total, child) => total + countNode(child), 0);
}
