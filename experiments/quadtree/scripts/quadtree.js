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
        this.maxDepth        = maxDepth;
        this.elementsPerNode = elementsPerNode;
        this.quadNodes       = new FixedList();
        this.objectNodes     = new FixedList();

        this.quadNodes.add(new QuadTreeNode(centerX, centerY, 1));
    }

    destroy()
    {
        
    }

    add(sceneObject)
    {
        this._insertObject(sceneObject);
    }

    remove(sceneObject)
    {

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

    _insertObject(sceneObject, startNode = null)
    {
        // Find all leaf nodes which this object intersects
        let leafNodes    = this._findLeafsWhichIntersect(sceneObject.renderable.aabb, startNode);
        let numLeafNodes = leafNodes.length;

        // Insert the object into each intersected leaf node
        while(numLeafNodes--)
        {
            this._addObjectToLeaf(leafNodes.pop(), sceneObject.id);
        }
    }

    /**
     * Constructs a list of all leaf nodes which intersect the provided AABB.
     * 
     * @param {*} aabb 
     */
    _findLeafsWhichIntersect(aabb, startNode = null)
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
                const childWidth  = this.width / (currentNode.depth + 1);
                const childHeight = this.height / (currentNode.depth + 1);

                // This is a branch node. Check the children.
                let ul = this.quadNodes.get(currentNode.firstChild + 0);       // Upper left child node
                let ur = this.quadNodes.get(currentNode.firstChild + 1);       // Upper right child node
                let lr = this.quadNodes.get(currentNode.firstChild + 2);       // Lower right child node
                let ll = this.quadNodes.get(currentNode.firstChild + 3);       // Lower left child node

                if(aabb.intersects(ul.center[0], ul.center[1], childWidth, childHeight))
                {
                    toTraverse.push(ul);
                }

                if(aabb.intersects(ur.center[0], ur.center[1], childWidth, childHeight))
                {
                    toTraverse.push(ur);
                }

                if(aabb.intersects(lr.center[0], lr.center[1], childWidth, childHeight))
                {
                    toTraverse.push(lr);
                }

                if(aabb.intersects(ll.center[0], ll.center[1], childWidth, childHeight))
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

        // If the leaf is full and not at max depth, split it
        if((leaf.numElements >= this.elementsPerNode) && (leaf.depth < this.maxDepth))
        {
            // Child objects of the leaf
            let leafObjects = this._getObjectNodeList(leaf.firstChild);

            //
            let childDepth      = leaf.depth + 1;
            let childHalfWidth  = this.width / (childDepth * 2);
            let childHalfHeight = this.height / (childDepth * 2);

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
        else 
        {
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
        }
    }

    _intersects(sceneObject, node)
    {

        return false;
    }

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
}

class QuadTreeDebugObject extends SceneObject
{
    constructor(renderer, quadTree)
    {
        super(renderer);

        this.quadTree = quadTree;
        this.renderable.material = "quadtree_visualizer";
        this.scale(this.quadTree.width, this.quadTree.height, 1.0);
    }
}