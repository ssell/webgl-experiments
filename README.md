# WebGL Experiments

**DISCLAIMER**

The usage of the word _experiment_ should always be kept in mind when viewing, evaluating, or using any of the code or ideas demonstrated within this repository.

## Overview

### [(View the Experiments Live)](http://ssell.github.io/webgl-experiments)

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

### [`experiments/quadtree`](experiments/quadtree)

Demonstrates a QuadTree implementation which can be used to make more efficient scene queries.

### `...`

## Contact

Feel free to contact me with any questions or comments using the contact information listed at:

* https://www.vertexfragment.com/