# Experiments > Instancing


## Overview

Brief demonstration of the use of instancing in rendering large numbers of objects in only a few draw calls. Renders a number of `FlashingQuad` objects - each moving and changing their color independently from each other.

The initial rendering approach most developers take is to render each object individually. This is very simple both conceptually and in the implementation: simply iterate over all objects and call some form of a `render` method.

For instancing, we have to not only group like objects together, but also store their material property data within the same buffer(s). This approach is a bit more complicated, but the effort is rewarded with typically much better performance.

## Controls

There are two controls exposed in this demo:

* `instancing` - Checkbox to enable or disable the use of instancing. Results of the rendering operations are identical but the performance, especially with a high object count, varies drastically. Note the value of the `draw calls` stat.
* `objects` - The number of objects to render, on the range of `[0, 50000]`.