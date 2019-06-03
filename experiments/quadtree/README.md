# Experiments > QuadTree

### [(View It Live)](http://ssell.github.io/webgl-experiments/experiments/quadtree/index.html)

## Overview

Example implementation of a QuadTree which can be used for more efficient scene queries, such as:

* Ray intersections (along with various bounds intersections)
* Determining visible objects to render
* Path finding (such as A*)

It should be noted that this sample only demonstrates the first point. The other ones may be added to this experiment in the future, or may have their own dedicated experiments.

## Controls

There are four controls exposed in this demo:

* `spawn random quad` - When clicked, spawns a random quad in the scene. Hint: click the button once (or tab to it) and then hold `enter` to spawn quads rapidly.
* `output tree structure` - Outputs the tree structure as a basic list of nodes in the text box. This is done on-request (as opposed to being done automatically) as updating the HTML with large tree structures is very costly.
* `left mouse click` - Spawns a quad at the specified location in the scene.
* `shift + left mouse click` - Removes the clicked quad. If the mouse ray intersects multiple quads then removes the first in the leaf node (which may not be the top-most quad).