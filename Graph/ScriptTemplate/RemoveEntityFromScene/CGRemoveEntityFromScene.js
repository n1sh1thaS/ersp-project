const {BaseNode} = require('../Utils/BaseNode');
const {GraphManager} = require('../Utils/GraphManager');
const APJS = require('../../../amazingpro');

class CGRemoveEntityFromScene extends BaseNode {
  constructor() {
    super();
    this.sys = null;

    // Entities belong to the original sticker scene should be restored at resetOnRecord,
    // Use a stack to store entities deleted by this node and restore them in the order FILO.
    this.deletedOriginalEntityInfos = [];
  }

  beforeStart(sys) {
    this.sys = sys;
  }

  execute() {
    const entity = this.inputs[1]();

    if (entity === null || entity === undefined) {
      console.error('Input entity to be removed is null');
      return;
    }

    console.log('CGRemoveEntityFromScene removeEntityFromScene', entity.name);

    const scene = this.sys.APJScene;
    const sceneObjs = scene.getAllSceneObjects();

    const sceneObjGuids = sceneObjs.map(obj => obj.guid.toString());
    if (!sceneObjGuids.includes(entity.guid.toString())) {
      console.error('Input entity does not belong to current scene');
      return;
    }

    // TODO: wait for APJS to fix SceneObject release issue and we can use below simple guid cache method
    // const entityPrefabGuid = entity.graphSystemPrefabGuid;

    const isCreatedResult = this.isEntityCreatedByGraphPrefab(entity);
    const isCreatedByGraph = isCreatedResult[0];
    const entityPrefabGuid = isCreatedResult[1];

    if (isCreatedByGraph && entityPrefabGuid) {
      this.removeEntityFromScene(scene, entity);
      // decrease global prefab instance count if from prefab
      let currentCount = GraphManager.getInstance().prefabInstanceCountMap.get(entityPrefabGuid) || 0;
      currentCount--;
      currentCount = Math.max(currentCount, 0);
      GraphManager.getInstance().prefabInstanceCountMap.set(entityPrefabGuid, currentCount);
    } else {
      const parent = entity.parent;
      const index = this.findIndexInParent(entity);

      if (index < 0) {
        console.error('CGRemoveEntityFromScene Deleted entity does not belong to current parent');
        if (this.nexts[0]) {
          this.nexts[0]();
        }
        return;
      }
      const prevSibling = index === 0 ? null : parent.getChildren()[index - 1];
      this.deletedOriginalEntityInfos.push({
        entity: entity,
        parent: parent,
        prevSibling: prevSibling,
      });
      this.disableAndRemoveFromParent(entity);
    }

    if (this.nexts[0]) {
      this.nexts[0]();
    }
  }

  removeEntityFromScene(scene, entity) {
    const parentEntity = this.getParentEntity(entity);
    const transform = entity.getComponent('Transform');

    const worldPosition = transform.getWorldPosition();
    const worldOrientation = transform.getWorldRotation();
    const worldScale = transform.getWorldScale();

    if (parentEntity) {
      entity.parent = null;
    }
    // Remove the entity from the scene
    const removed = scene.removeSceneObject(entity);

    // preserve world transform
    transform.setWorldPosition(worldPosition);
    transform.setWorldRotation(worldOrientation);
    transform.setWorldScale(worldScale);
  }

  disableAndRemoveFromParent(entity) {
    const parentEntity = this.getParentEntity(entity);
    const transform = entity.getComponent('Transform');

    const worldPosition = transform.getWorldPosition();
    const worldOrientation = transform.getWorldRotation();
    const worldScale = transform.getWorldScale();

    if (parentEntity) {
      entity.parent = null;
    }

    // preserve world transform
    transform.setWorldPosition(worldPosition);
    transform.setWorldRotation(worldOrientation);
    transform.setWorldScale(worldScale);

    entity.enabled = false;
    entity.setEnabledInHierarchy(false);
  }

  getParentEntity(entity) {
    return entity.parent ? entity.parent : undefined;
  }

  isEntityCreatedByGraphPrefab(entity) {
    let result = false;
    let prefabGuid = undefined;
    const entityGuid = entity.guid.toString();
    GraphManager.getInstance().prefabGuidToInstanceMap.forEach((instanceSet, srcPrefabGuid) => {
      if (result) {
        return;
      }
      if (instanceSet.has(entityGuid)) {
        result = true;
        prefabGuid = srcPrefabGuid;
      }
    });
    return [result, prefabGuid];
  }

  resetOnRecord(sys) {
    while (this.deletedOriginalEntityInfos.length) {
      const entityInfo = this.deletedOriginalEntityInfos.pop();
      const entity = entityInfo.entity;
      const parent = entityInfo.parent;
      const prevSibling = entityInfo.prevSibling;
      this.addEntityToParent(entity, parent, prevSibling !== null, prevSibling);
      entity.enabled = true;
      entity.setEnabledInHierarchy(true);
    }
    this.deletedOriginalEntityInfos = [];
  }

  addEntityToParent(entity, parent, pushBack = true, sibling = null) {
    console.log('add removed entity back', entity.name, parent.name, sibling);

    const transform = entity.getComponent('Transform');

    const worldPosition = transform.getWorldPosition();
    const worldOrientation = transform.getWorldRotation();
    const worldScale = transform.getWorldScale();

    if (entity.parent) {
      entity.parent = null;
    }

    // If the parent exists, modify the transform parent-child relationship
    const parentTransform = parent.getComponent('Transform');
    const childEntities = parent.getChildren();

    //to send add transform event;
    transform.getSceneObject().parent = parentTransform.getSceneObject();
    // childTransforms.popBack();

    if (sibling && childEntities.includes(sibling)) {
      const index = childEntities.indexOf(sibling);
      pushBack
        ? APJS.SceneUtils.moveSceneObjectUnderRoot(parent, entity, index + 1)
        : APJS.SceneUtils.moveSceneObjectUnderRoot(parent, entity, Math.max(0, index - 1));
    } else {
      pushBack
        ? APJS.SceneUtils.moveSceneObjectUnderRoot(parent, entity, -1)
        : APJS.SceneUtils.moveSceneObjectUnderRoot(parent, entity, 0);
    }

    // preserve world transform
    transform.setWorldPosition(worldPosition);
    transform.setWorldRotation(worldOrientation);
    transform.setWorldScale(worldScale);
  }

  findIndexInParent(entity) {
    const parent = entity.parent;
    let index = -1; // FIXME: wait APJS to fix indexOf issues: parent.getChildren().indexOf(entity);
    parent.getChildren().forEach((child, i) => {
      if (entity.getNative().equals(child.getNative())) {
        index = i;
      }
    });
    return index;
  }
}

exports.CGRemoveEntityFromScene = CGRemoveEntityFromScene;
