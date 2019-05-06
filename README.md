# WebGL Experiments

**DISCLAIMER**

The usage of the word _experiment_ should always be kept in mind when viewing, evaluating, or using any of the code or ideas demonstrated within this repository.

## Overview

A collection of various experiments made using WebGL. 

In addition to the ideas displayed in the various demos, this repository houses a very simple rendering engine with the following concepts:

* `Scene` - composed of a number of scene objects
* `SceneObject` - individual object in the scene with it's own rendering information and update logic
* `RenderableComponent` - combination of a material and mesh
* `Material` - combination of a shader program and a collection of uniforms and properties
* `MaterialPropertyBlock` - properties supplied as input to shaders. Either a uniform or attribute dependending on the material.
* `Mesh` - combination of a vertex and index buffer
* `Renderer` - responsible for drawing all applicable scene objects
* `Transform` - combination of a position, rotation, and scale
## Experiments

### [`experiments/instancing`](experiments/instancing)

Demonstrates the use of instancing to render large numbers of objects more efficiently.

### `...`