import * as THREE from 'three';
import { Vector3 } from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { scene, transformControls,
    mouseButtonIsDown,
    cortexMeshUrl,
    innerSkullMeshUrl,
    scalpMeshUrl,
    camera,
    renderer,
    controls,
     GLOBAL_LAYER } from "../public/main.js";
import { guiParams } from './setup_gui';
import { deleteMesh } from './mesh_helper.js';
import { loadGltfModel } from './load_data.js';

let extraItemMesh;
let secondBrainMesh;

let initExtraItemPosition = new Vector3(0,-13,0);
let initExtraItemRotation = new Vector3(0,0,0);
let initExtraItemScale = new Vector3(.8,.8,.8);

let transformControlHistory = [];
let transformControlHistoryToken;

let transformControlsEnabled = false;

const cortexMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    opacity: 0.15,      // Set opacity level (0 = fully transparent, 1 = fully opaque)
    transparent: true, // Enable transparency
    side: THREE.DoubleSide,
    flatShading: false
});

let dualBrainGroup = null;

// Create separate transform controls for each brain
let mainBrainTransformControls = null;
let secondBrainTransformControls = null;
let mainBrainControlsEnabled = false;
let secondBrainControlsEnabled = false;

// Initialize both transform controls
function initTransformControls() {
  try {
    const domElement = document.getElementById('renderer');
    if (!domElement) {
      console.error("Could not find renderer DOM element");
      return;
    }
    
    // Main brain controls
    mainBrainTransformControls = new TransformControls(camera, domElement);
    // Use an anonymous function to properly handle the event
    mainBrainTransformControls.addEventListener('change', function() {
      renderer.render(scene, camera); // Explicitly call render
    });
    mainBrainTransformControls.addEventListener('dragging-changed', function(event) {
      controls.enabled = !event.value;
    });
    scene.add(mainBrainTransformControls);
    
    // Second brain controls
    secondBrainTransformControls = new TransformControls(camera, domElement);
    secondBrainTransformControls.addEventListener('change', function() {
      renderer.render(scene, camera); // Explicitly call render
    });
    secondBrainTransformControls.addEventListener('dragging-changed', function(event) {
      controls.enabled = !event.value;
    });
    scene.add(secondBrainTransformControls);
    
    console.log("Transform controls initialized successfully");
  } catch (error) {
    console.error("Error initializing transform controls:", error);
  }
}

// function initTransformControls() {
//   try {
//     console.log("Initializing transform controls");
//     console.log("Camera:", camera);
//     console.log("Renderer:", renderer);
//     console.log("DOM Element:", renderer.domElement);
    
//     // Test with just one control first
//     mainBrainTransformControls = new TransformControls(camera, renderer.domElement);
//     console.log("Transform controls created successfully");
    
//     scene.add(mainBrainTransformControls);
//     console.log("Transform controls added to scene");
//   } catch (error) {
//     console.error("Error initializing transform controls:", error);
//   }
// }

function loadAndDrawCortexModel(){
    removeExtraItemMesh();
    loadCortexModel()
        .then((response) => drawExtraItemModel(response));
}

function drawExtraItemModelWithOffset(geometry, newPosition) {
    console.log('Drawing model with offset:', newPosition);
    
    if (!geometry) {
        console.error('ERROR: Geometry is null or undefined.');
        return;
    }

    let position = newPosition;  // Use the provided offset position
    let rotation = initExtraItemRotation;
    let scale = initExtraItemScale;

    console.log("222 position:", position);
    console.log("222 rotation:", rotation);
    console.log("222 scale:", scale);

    secondBrainMesh = new THREE.Mesh(geometry, cortexMaterial.clone());
    secondBrainMesh.geometry.computeVertexNormals();
    
    // Apply the position
    secondBrainMesh.position.set(position.x, position.y, position.z);
    secondBrainMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    secondBrainMesh.scale.set(scale.x, scale.y, scale.z);
    
    scene.add(secondBrainMesh);
    console.log("Added second cortex model at:", secondBrainMesh.position);
}


function loadAndDrawCortexDualModel() {
    loadCortexModel()
        .then((geometry) => {
            console.log("Drawing first cortex model");
            // Rotate the first brain 180 degrees so it faces left
            const firstGeometry = geometry.clone();
            firstGeometry.rotateY(Math.PI);
            drawExtraItemModel(firstGeometry); // First model at the default position
        });

    loadCortexModel()
        .then((geometry) => {
            console.log("Drawing second cortex model at a new position");
            const clonedGeometry = geometry.clone();

            // Move second brain to the left
            const offsetPosition = new Vector3(initExtraItemPosition.x - 200, initExtraItemPosition.y, initExtraItemPosition.z);
            // Keep the second brain's original orientation (facing right)
            // No rotation needed here
            drawExtraItemModelWithOffset(clonedGeometry, offsetPosition);
        });
}

function drawExtraItemInnerSkullModel(){
    loadInnerSkullModel().then((response) => drawExtraItemModel(response));
}

function loadAndDrawScalpModel(){
    loadScalpModel().then((response) => drawExtraItemModel(response));
}

function drawExtraItemSphereModel(){
    const geometry = new THREE.SphereGeometry( 32, 32, 16 );
    drawExtraItemModel(geometry);
}

function drawExtraItemCubeModel(){
    const geometry = new THREE.BoxGeometry( 40, 40, 40 );
    drawExtraItemModel(geometry);
}

function loadCortexModel(){
    return loadGltfModel(cortexMeshUrl, 'cortex model',
        (gltf) => {
            const hemi0Mesh = gltf.scene.children[0].children[0];
            const hemi1Mesh = gltf.scene.children[0].children[1];
            return BufferGeometryUtils.mergeGeometries([hemi0Mesh.geometry, hemi1Mesh.geometry]);
    });
}

function loadInnerSkullModel(){
    return loadGltfModel(innerSkullMeshUrl, 'inner skull model');
}

function loadScalpModel(){
    return loadGltfModel(scalpMeshUrl, 'Scalp model');
}

function drawExtraItemModel(geometry) {    
    let position = initExtraItemPosition;
    let rotation = initExtraItemRotation;
    let scale = initExtraItemScale;

    
    if (extraItemMesh){
        position = extraItemMesh.position.clone();
        rotation = extraItemMesh.rotation.clone();
        scale = extraItemMesh.scale.clone();
        removeExtraItemMesh();
    }

    extraItemMesh = new THREE.Mesh( geometry, cortexMaterial );
    extraItemMesh.geometry.computeVertexNormals();
    updateExtraItemMeshVisibility();

    initNewExtraItemShape(position, rotation, scale);
    scene.add(extraItemMesh);
}

function resetPositionExtraItemMesh(){
    transformControlHistory.push({
        position: extraItemMesh.position.clone(),
        rotation: extraItemMesh.rotation.clone(),
        scale: extraItemMesh.scale.clone()
    });
    repositionExtraItemMesh(initExtraItemPosition, initExtraItemRotation, initExtraItemScale);
}

function initNewExtraItemShape(position, rotation, scale){
    extraItemMesh.receiveShadow = true;
    extraItemMesh.castShadow = true;
    repositionExtraItemMesh(position, rotation, scale);
}

function repositionExtraItemMesh(position, rotation, scale){
    extraItemMesh.position.set(position.x, position.y, position.z);
    extraItemMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    extraItemMesh.scale.set(scale.x, scale.y, scale.z);
}

function updateExtraItemMeshVisibility(){
    extraItemMesh.visible = guiParams.showExtraItem;
    if(guiParams.showExtraItem) {extraItemMesh.layers.enable(GLOBAL_LAYER)}
    else {extraItemMesh.layers.disable(GLOBAL_LAYER)};
}

function hideExtraItem(){
    guiParams.showExtraItem = false;
    updateExtraItemMeshVisibility();
}

function showExtraItem(){
    guiParams.showExtraItem = true;
    updateExtraItemMeshVisibility();
}

function removeExtraItemMesh() {
  // Detach transform controls
  if (mainBrainControlsEnabled) {
    mainBrainTransformControls.detach();
    mainBrainControlsEnabled = false;
  }
  
  if (secondBrainControlsEnabled) {
    secondBrainTransformControls.detach();
    secondBrainControlsEnabled = false;
  }
  
  // Remove meshes
  if (extraItemMesh) {
    deleteMesh(extraItemMesh);
    extraItemMesh = null;
  }
  
  if (secondBrainMesh) {
    deleteMesh(secondBrainMesh);
    secondBrainMesh = null;
  }
}

function updateExtraItemMaterial(){
    if (extraItemMesh){
        extraItemMesh.material.color = new THREE.Color(guiParams.colorExtraItem);
    }
}

function updateExtraItemMesh(){
    showExtraItem();
    disableTransformControls();
    if (guiParams.extraItemMeshShape == 'brain'){
        loadAndDrawCortexModel();
    }
    if (guiParams.extraItemMeshShape == 'innerSkull'){
        drawExtraItemInnerSkullModel();
    }
    if (guiParams.extraItemMeshShape == 'scalp'){
        loadAndDrawScalpModel();
    }
    if (guiParams.extraItemMeshShape == 'sphere'){
        drawExtraItemSphereModel();
    }
    if (guiParams.extraItemMeshShape == 'cube'){
        drawExtraItemCubeModel();
    }
    if (guiParams.extraItemMeshShape == 'dualBrain') {
        loadAndDrawCortexDualModel();
    }
}

// Toggle controls for the selected brain

function toggleTransformControls(mode, brainIndex = 0) {
  console.log(`Toggling ${mode} mode for brain ${brainIndex}`);
  
  try {
    // Disable all controls first to avoid conflicts
    if (mainBrainControlsEnabled) {
      mainBrainTransformControls.detach();
      mainBrainControlsEnabled = false;
    }
    
    if (secondBrainControlsEnabled) {
      secondBrainTransformControls.detach();
      secondBrainControlsEnabled = false;
    }
    
    // Now enable the requested control
    if (brainIndex === 0 && extraItemMesh) {
      mainBrainTransformControls.attach(extraItemMesh);
      mainBrainTransformControls.setMode(mode);
      mainBrainControlsEnabled = true;
    } else if (brainIndex === 1 && secondBrainMesh) {
      secondBrainTransformControls.attach(secondBrainMesh);
      secondBrainTransformControls.setMode(mode);
      secondBrainControlsEnabled = true;
    }
  } catch (error) {
    console.error("Error toggling transform controls:", error);
  }
}

// Disable controls for the specified brain
function disableTransformControls(brainIndex = 0) {
    if (brainIndex === 0 && mainBrainControlsEnabled) {
        mainBrainTransformControls.detach();
        mainBrainControlsEnabled = false;
    } else if (brainIndex === 1 && secondBrainControlsEnabled) {
        secondBrainTransformControls.detach();
        secondBrainControlsEnabled = false;
    }
}

function translateModeTransformControls(brainIndex = 0){
    toggleTransformControls('translate', brainIndex);
}
function rotateModeTransformControls(brainIndex = 0){
    toggleTransformControls('rotate', brainIndex);
}
function scaleModeTransformControls(brainIndex = 0){
    toggleTransformControls('scale', brainIndex);
}

function handleTransformControlChangeEvent(event){
    if (mouseButtonIsDown && transformControlHistoryToken == null){
        transformControlHistoryToken = {
            position: extraItemMesh.position.clone(),
            rotation: extraItemMesh.rotation.clone(),
            scale: extraItemMesh.scale.clone()
        };
    }
}

function updateTransformControlHistory(){
    if (transformControlHistoryToken){
        transformControlHistory.push(transformControlHistoryToken);
        transformControlHistoryToken = null;
      }
}

function undoTransformControls(){
    if (transformControlHistory.length == 0){ return; }
    const previousTransfo = transformControlHistory.pop();
    repositionExtraItemMesh(previousTransfo.position, previousTransfo.rotation, previousTransfo.scale);
}

export {
    loadAndDrawCortexModel,
    loadAndDrawCortexDualModel,
    drawExtraItemSphereModel,
    updateExtraItemMeshVisibility as updateBrainMeshVisibility,
    hideExtraItem,
    showExtraItem,
    updateExtraItemMaterial,
    updateExtraItemMesh,
    translateModeTransformControls,
    rotateModeTransformControls,
    scaleModeTransformControls,
    resetPositionExtraItemMesh,
    disableTransformControls,
    handleTransformControlChangeEvent,
    updateTransformControlHistory,
    undoTransformControls,
    initTransformControls,
    toggleTransformControls
};