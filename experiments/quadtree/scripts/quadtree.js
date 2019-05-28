/**
 * Represents an individual node within the `QuadTree`.
 * 
 * This can represent either a branch node, where `firstChild` points to the index of the first child `QuadTreeNode`,
 * or it can represent a leaf node, where `firstChild` points to the index of the first child `QuadTreeElementNode`.
 */
class QuadTreeNode
{
    constructor(x, y, depth)
    {
        this.firstChild  = -1;    // Points to either the first child QuadTreeNode index (branch) or to the first child QuadTreeObjectNode (leaf).
        this.numElements = 0;     // Number of elements referenced by this node. If -1, this is a branch. Otherwise, this is a leaf.
        this.center      = [x, y];
        this.depth       = depth;
    }
}

/**
 * Represents an object stored in a leaf `QuadTreeNode`.
 * 
 * Each `QuadTreeObjectNode` references a `SceneObject` by it's index in the parent `SceneTree`.
 * Multiple `QuadTreeObjectNode` may refer to the same `SceneObject` if it happens to occupy multiple quadrants at the same time.
 */
class QuadTreeObjectNode
{
    constructor(objectId)
    {
        this.objectId = objectId;   // Index of the referenced SceneObject
        this.next    = -1;          // Index of the next object node in the leaf
    }
}

/**
 * A simple QuadTree using indexed nodes and SceneObjects.
 * 
 * Example QuadTree with 5 objects (2 in upper-left, 3 in lower-left:
 * 
 *     QTN = QuadTreeNode
 *     QON = QuadTreeObjectNode
 * 
 *  D:0                            QuadTreeNode:0   (Root)                
 *                                        │                               
 *  D:1                 ┌───────────┬───────────┬───────────┐             
 *                     QTN:1       QTN:2       QTN:3       QTN:4          
 *                      │                                   │             
 *  D:2     ┌───────┬───────┬───────┐           ┌───────┬───────┬───────┐ 
 *         QON:0   QON:1   N/A     N/A         QON:2   QON:3   QON:4   N/A
 * 
 */
class QuadTree extends SceneTree
{
    constructor(width, height, centerX = 0, centerY = 0, maxDepth = 3, elementsPerNode = 4)
    {
        super();

        this.width           = width;
        this.height          = height;
        this.centerX         = centerX;
        this.centerY         = centerY;
        this.maxDepth        = maxDepth;
        this.elementsPerNode = elementsPerNode;
        this.quadNodes       = new FixedList();
        this.objectNodes     = new FixedList();

        this.quadNodes.add(new QuadTreeNode(centerX, centerY, 1));
    }

    destroy()
    {
        
    }

    /**
     * Should be called once a frame (ideally at the end) so that 
     * the scene tree can perform any clean up or reorganization.
     */
    tick()
    {
        // Iterate over all nodes. If a branch node has 4 empty leaf nodes, 
        // then remove the leaf nodes and make the branch node a leaf.
        for(let i = 0; i < this.quadNodes.length; ++i)
        {
            let node = this.quadNodes.get(i);

            // If this is a branch
            if(node.numElements == -1)
            {
                let numLeafChildren = 
                    this.quadNodes.get(node.firstChild + 0).numElements +
                    this.quadNodes.get(node.firstChild + 1).numElements +
                    this.quadNodes.get(node.firstChild + 2).numElements +
                    this.quadNodes.get(node.firstChild + 3).numElements;

                // If none of the leaf node children of this branch contain any object references
                if(numLeafChildren == 0)
                {
                    // Remove the leaf nodes and turn this branch into a leaf.
                    this.quadNodes.remove(node.firstChild + 0);
                    this.quadNodes.remove(node.firstChild + 1);
                    this.quadNodes.remove(node.firstChild + 2);
                    this.quadNodes.remove(node.firstChild + 3);

                    node.firstChild  = -1;
                    node.numElements = 0;
                }
            }
        }
    }

    /**
     * @param {SceneObject} sceneObject 
     */
    add(sceneObject)
    {
        this._insertObject(sceneObject);
    }

    /**
     * @param {Number} sceneObjectId 
     */
    remove(sceneObject)
    {
        // Find all the leafs which may contain references to this object
        let leafNodes = this._findLeafsWhichIntersect(Intersects.AABBWithRectangle, sceneObject.aabb)

        // Remove any references to this scene object
        for(let i = 0; i < leafNodes.length; ++i)
        {
            if(leafNodes[i].numElements == 0)
            {
                continue;
            }

            let lastObjectNodeId = leafNodes[i].firstChild;
            let currObjectNodeId = lastObjectNodeId;

            // Iterate all object nodes in the linked list
            while(currObjectNodeId != -1)
            {
                let lastObjectNode   = this.objectNodes.get(lastObjectNodeId);
                let currObjectNode   = this.objectNodes.get(currObjectNodeId);
                let nextObjectNodeId = currObjectNode.next;

                // If this object node references the scene object
                if(currObjectNodeId == sceneObject.id)
                {
                    // Remove the node and update leaf object count
                    this.objectNodes.remove(currObjectNodeId);
                    leafNodes.numElements--;

                    // Update references to this object node
                    if(lastObjectNodeId != currObjectNodeId)
                    {
                        // This is not the first object node in the leaf, so update last node's next
                        lastObjectNode.next = nextObjectNodeId;
                    }
                    else
                    {
                        // This is the first object node in the leaf, update the leaf node's first child member
                        leafNodes[i].firstChild = nextObjectNodeId;
                        lastObjectNodeId = nextObjectNodeId;  // Next is now the new start so it is also the last node visited
                    }
                }
                else
                {
                    lastObjectNodeId = currObjectNodeId;
                }

                currObjectNodeId = nextObjectNodeId;
            }
        }
    }
    
    /**
     * Returns a list of all SceneObjects whose bounds intersect with the provided Ray.
     * 
     * @param {Ray} ray
     * @returns {SceneObject[]}
     */
    findIntersectionsRay(ray)
    {
        return this._findIntersections(Intersects.RayWithRectangle, Intersects.RayWithAABB, ray);
    }
    
    /**
     * Returns a list of all SceneObjects whose bounds intersect with the provided BoundsAABB.
     * 
     * @param {BoundsAABB} aabb
     * @returns {SceneObject[]}
     */
    findIntersectionsAABB(aabb)
    {
        return this._findIntersections(Intersects.AABBWithRectangle, Intersects.AABBWithAABB, aabb);
    }

    
    /**
     * Returns a list of all SceneObjects whose bounds intersect with the provided BoundsSphere.
     * 
     * @param {BoundsSphere} sphere
     * @returns {SceneObject[]}
     */
    findIntersectionsSphere(sphere)
    {
        return this._findIntersections(Intersects.SphereWithRectangle, Intersects.SphereWithAABB, sphere);
    }

    /**
     * 
     * @param {*} boundWithRectFunc Function which performs Rectangle intersection. `Intersects.RayWithRectangle`, etc.
     * @param {*} boundWithAABBFunc Function which performs AABB intersection. `Intersects.RayWithAABB`, etc.
     * @param {*} bound Object to perform intersection against (BoundsAABB, BoundsSphere, or Ray).
     * @returns {SceneObject[]}
     */
    _findIntersections(boundWithRectFunc, boundWithAABBFunc, bound)
    {
        let objects = [];

        // Find all leaf nodes which this Ray intersects
        let leafNodes      = this._findLeafsWhichIntersect(boundWithRectFunc, bound);
        let numLeafNodes   = leafNodes.length;
        let sceneObjectIds = [];

        // For each leaf node which intersects
        while(numLeafNodes--)
        {
            let leaf = leafNodes.pop();

            if(leaf.numElements == 0)
            {
                continue;
            }

            // Get all objects referenced in the leaf
            this._buildSceneObjectList(leaf, sceneObjectIds);
        }

        // Remove duplicates as a single SceneObject may be referenced by multiple QuadTreeObjectNodes if it spans boundaries
        sceneObjectIds = [...new Set(sceneObjectIds)];

        // Check for intersection against each potential object
        for(let i = 0; i < sceneObjectIds.length; ++i)
        {
            let sceneObject = this.scene.getSceneObject(sceneObjectIds[i]);

            if(boundWithAABBFunc(bound, sceneObject.renderable.aabb).result != IntersectionType.None)
            {
                objects.push(sceneObject);
            }
        }

        return objects;
    }

    update()
    {

    }

    /**
     * Traverses the tree structure and prints it to console
     */
    debugTraverse()
    {
        var orderedNodes = [];
        this._buildOrderedNodes(orderedNodes, 0);

        var output  = "";

        for(let i = 0; i < orderedNodes.length; ++i)
        {
            let numElements = orderedNodes[i].node.numElements;
            let nodeId = orderedNodes[i].id;

            if(numElements == -1)
            {
                let first = orderedNodes[i].node.firstChild;
                output += `B:${nodeId} (ul:${first}, ur:${first + 1}, lr:${first + 2}, ll:${first + 3})<br/>`;
            }
            else 
            {
                output += `L:${nodeId} (${numElements})<br/>`;
            }
        }

        return output;
    }

    /**
     * Traverses the tree and returns a list of node information used in debug rendering.
     * The list is formatted as:
     * 
     *     [ node0.x, node0.y, node0.depth, node0.isLeaf, node1.x, node1.y, node1.depth, node1.isLeaf, ... ]
     * 
     * @param {Boolean} includeBranches 
     * @param {Boolean} includeLeaves 
     */
    debugTraverseGetNodeList(includeBranches = true, includeLeaves = true)
    {
        // Traverses all nodes.
        let orderedNodes = [];
        let nodeInfo = [];
        this._buildOrderedNodes(orderedNodes, 0);


        for(let i = 0; i < orderedNodes.length; ++i)
        {
            let node = orderedNodes[i].node;
            let isLeaf = this._isLeaf(node);

            if(isLeaf && !includeLeaves)
            {
                continue;
            }

            if(!isLeaf && !includeBranches)
            {
                continue;
            }

            nodeInfo.push(node.center[0], node.center[1], node.depth, (isLeaf ? 1 : 0));
        }

        return nodeInfo;
    }

    /**
     * 
     * @param {QuadTreeNode[]} orderedNodes 
     * @param {Number} current 
     */
    _buildOrderedNodes(orderedNodes, current)
    {
        let node = this.quadNodes.get(current);

        orderedNodes.push({ node: node, id: current });

        if((node.firstChild != -1) && (node.numElements == -1))
        {
            this._buildOrderedNodes(orderedNodes, node.firstChild + 0);
            this._buildOrderedNodes(orderedNodes, node.firstChild + 1);
            this._buildOrderedNodes(orderedNodes, node.firstChild + 2);
            this._buildOrderedNodes(orderedNodes, node.firstChild + 3);
        }
    }

    /**
     * 
     * @param {SceneObject} sceneObject 
     * @param {QuadTreeNode} startNode 
     */
    _insertObject(sceneObject, startNode = null)
    {
        // Find all leaf nodes which this object intersects
        let leafNodes    = this._findLeafsWhichIntersect(Intersects.AABBWithRectangle, sceneObject.renderable.aabb, startNode);
        let numLeafNodes = leafNodes.length;

        // Insert the object into each intersected leaf node
        while(numLeafNodes--)
        {
            this._addObjectToLeaf(leafNodes.pop(), sceneObject.id);
        }
    }

    /**
     * Constructs a list of all leaf nodes which intersect the provided bound object (BoundsAABB, BoundsSphere, or Ray).
     * 
     * @param {*} bound 
     * @param {QuadTreeNode} startNode
     */
    _findLeafsWhichIntersect(intersectionFunc, bound, startNode = null)
    {
        let toTraverse = [ (startNode == null ? this.quadNodes.get(0) : startNode) ];
        let leafNodes  = [];

        while(toTraverse.length > 0)
        {
            let currentNode = toTraverse.pop();

            if(currentNode.numElements != -1)
            {
                // This is a leaf node, add it to the list.
                leafNodes.push(currentNode);
            }
            else
            {
                const childDepth  = currentNode.depth + 1;
                const childWidth  = this.width / Math.pow(2, childDepth);
                const childHeight = this.height / Math.pow(2, childDepth);

                // This is a branch node. Check the children.
                let ul = this.quadNodes.get(currentNode.firstChild + 0);       // Upper left child node
                let ur = this.quadNodes.get(currentNode.firstChild + 1);       // Upper right child node
                let lr = this.quadNodes.get(currentNode.firstChild + 2);       // Lower right child node
                let ll = this.quadNodes.get(currentNode.firstChild + 3);       // Lower left child node

                if(intersectionFunc(bound, ul.center[0], ul.center[1], childWidth, childHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ul);
                }

                if(intersectionFunc(bound, ur.center[0], ur.center[1], childWidth, childHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ur);
                }

                if(intersectionFunc(bound, lr.center[0], lr.center[1], childWidth, childHeight).result != IntersectionType.None)
                {
                    toTraverse.push(lr);
                }

                if(intersectionFunc(bound, ll.center[0], ll.center[1], childWidth, childHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ll);
                }
            }
        }

        return leafNodes;
    }

    /**
     * Constructs a list of all leaf nodes which intersect the provided Ray.
     * 
     * @param {Ray} ray 
     * @param {QuadTreeNode} startNode
     */
    _findLeafsWhichIntersectRay(ray, startNode = null)
    {
        let toTraverse = [ (startNode == null ? this.quadNodes.get(0) : startNode) ];
        let leafNodes  = [];

        while(toTraverse.length > 0)
        {
            let currentNode = toTraverse.pop();

            if(currentNode.numElements != -1)
            {
                // This is a leaf node, add it to the list.
                leafNodes.push(currentNode);
            }
            else
            {
                const childDepth      = currentNode.depth + 1;
                const childHalfWidth  = this.width / Math.pow(2, childDepth);
                const childHalfHeight = this.height / Math.pow(2, childDepth);

                // This is a branch node. Check the children.
                let ul = this.quadNodes.get(currentNode.firstChild + 0);       // Upper left child node
                let ur = this.quadNodes.get(currentNode.firstChild + 1);       // Upper right child node
                let lr = this.quadNodes.get(currentNode.firstChild + 2);       // Lower right child node
                let ll = this.quadNodes.get(currentNode.firstChild + 3);       // Lower left child node

                if(Intersects.AABBWithRectangle(aabb, ul.center[0], ul.center[1], childHalfWidth, childHalfHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ul);
                }

                if(Intersects.AABBWithRectangle(aabb, ur.center[0], ur.center[1], childHalfWidth, childHalfHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ur);
                }

                if(Intersects.AABBWithRectangle(aabb, lr.center[0], lr.center[1], childHalfWidth, childHalfHeight).result != IntersectionType.None)
                {
                    toTraverse.push(lr);
                }

                if(Intersects.AABBWithRectangle(aabb, ll.center[0], ll.center[1], childHalfWidth, childHalfHeight).result != IntersectionType.None)
                {
                    toTraverse.push(ll);
                }
            }
        }

        return leafNodes;
    }

    _addObjectToLeaf(leaf, id)
    {
        let objectNode      = new QuadTreeObjectNode(id);
        let objectNodeIndex = this.objectNodes.add(objectNode);

        // Add object node to the leaf
        if(leaf.numElements == 0)
        {
            // First element in the leaf
            leaf.firstChild = objectNodeIndex;
        }
        else
        {
            // Add this object to the end of the child linked list
            let leafChild = this.objectNodes.get(leaf.firstChild);

            while(leafChild.next != -1)
            {
                leafChild = this.objectNodes.get(leafChild.next);
            }

            leafChild.next = objectNodeIndex;
        }

        leaf.numElements++;

        // If the leaf is full and not at max depth, split it
        if((leaf.numElements >= this.elementsPerNode) && (leaf.depth < this.maxDepth))
        {
            // Child objects of the leaf
            let leafObjects = this._getObjectNodeList(leaf.firstChild);

            //
            const childDepth      = leaf.depth + 1;
            const childHalfWidth  = this.width / Math.pow(2, childDepth);
            const childHalfHeight = this.height / Math.pow(2, childDepth);

            // Create the four child nodes
            let childUL = new QuadTreeNode(leaf.center[0] - childHalfWidth, leaf.center[1] + childHalfHeight, childDepth);
            let childUR = new QuadTreeNode(leaf.center[0] + childHalfWidth, leaf.center[1] + childHalfHeight, childDepth);
            let childLR = new QuadTreeNode(leaf.center[0] + childHalfWidth, leaf.center[1] - childHalfHeight, childDepth);
            let childLL = new QuadTreeNode(leaf.center[0] - childHalfWidth, leaf.center[1] - childHalfHeight, childDepth);

            // Add the new nodes to the quadNodes list
            let firstChild = this.quadNodes.addGroup([childUL, childUR, childLR, childLL]);

            // Convert the leaf to a branch with the new child leaf nodes
            leaf.firstChild  = firstChild;
            leaf.numElements = -1;

            // Move the former child objects into the new leaf nodes
            for(let i = 0; i < leafObjects.length; ++i)
            {
                let objectIndex = leafObjects[i].objectId;
                this._insertObject(this.scene.getSceneObject(objectIndex), leaf);
            }
        }
    }

    _intersects(sceneObject, node)
    {

        return false;
    }

    /**
     * Returns a list of all ObjectNodes that are chained to the specified ObjectNode index.
     * 
     * @param {*} firstIndex 
     */
    _getObjectNodeList(firstIndex)
    {
        let objectNodes = [ this.objectNodes.get(firstIndex) ];
        let currentNode = objectNodes[0];

        while(currentNode.next != -1)
        {
            currentNode = this.objectNodes.get(currentNode.next);
            objectNodes.push(currentNode);
        }

        return objectNodes;
    }

    _buildSceneObjectList(leaf, sceneObjects)
    {
        let currentNode = this.objectNodes.get(leaf.firstChild);
        sceneObjects.push(currentNode.objectId);

        while(currentNode.next != -1)
        {
            currentNode = this.objectNodes.get(currentNode.next);
            sceneObjects.push(currentNode.objectId);
        }
    }

    _isLeaf(node)
    {
        return node.numElements != -1;
    }
}

/**
 * SceneObject which displays the state of a QuadTree.
 * 
 * Information about the nodes of the QuadTree are packed into a (N+1)x1 texture,
 * where N is the number of nodes in the tree, and then rendered by the `shader_quadtree_visualizer_fs` shader.
 */
class QuadTreeDebugObject extends SceneObject
{
    constructor(renderer, quadTree)
    {
        super(renderer);

        this.quadTree = quadTree;
        this.renderable.material = "quadtree_visualizer";
        this.scale(this.quadTree.width, this.quadTree.height, 1.0);

        this.qtTexture = new Texture(renderer.context, "qtdbg");
        this.renderable._materialReference.setTexture("qtdbg", 0);

        this.renderable.materialProps.setPropertyByName("QuadTreeInfo", [
            this.quadTree.width, 
            this.quadTree.height, 
            this.quadTree.centerX,
            this.quadTree.centerY]);
            
        this.totalDelta;
    }

    update(delta)
    {
        this.totalDelta += delta;

        if(this.totalDelta < 0.1)
        {
            return;
        }

        this.totalDelta = 0.0;

        // Insert the QuadTree structure info into the texture data
        this.qtTexture.data = this.quadTree.debugTraverseGetNodeList(true, false);

        // Prepend the structure info with the number of nodes in the QuadTree
        this.qtTexture.data.unshift(this.qtTexture.data.length / 4, 0.0, 0.0, 0.0);

        // Build the updated texture
        this.qtTexture.width = this.qtTexture.data[0] + 1;
        this.qtTexture.build();
    }
}