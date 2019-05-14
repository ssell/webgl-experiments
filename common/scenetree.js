/**
 * 
 */
class SceneTree
{
    constructor()
    {

    }

    add(sceneObject)
    {

    }

    remove(sceneObject)
    {

    }

    update()
    {
        
    }
}

/**
 * A basic list of SceneObjects that performs no hierarchical ordering.
 */
class SceneList extends SceneTree
{
    constructor()
    {
        super();

        this.sceneObjects = [];
    }

    add(sceneObject)
    {
        let index = this.sceneObjects.indexOf(sceneObject);

        if(index == -1)
        {
            this.sceneObjects.push(sceneObject);
        }
    }

    remove(sceneObject)
    {
        let index = this.sceneObjects.indexOf(sceneObject);

        if(index != -1)
        {
            this.sceneObjects.splice(index, 1);
        }
    }

    update()
    {
        
    }
}

/**
 * Represents an individual node within the `QuadTree`.
 * 
 * This can represent either a branch node, where `firstChild` points to the index of the first child `QuadTreeNode`,
 * or it can represent a leaf node, where `firstChild` points to the index of the first child `QuadTreeElementNode`.
 */
class QuadTreeNode
{
    constructor(x, y)
    {
        this.firstChild  = -1;    // Points to either the first child QuadTreeNode index (branch) or to the first child QuadTreeObjectNode (leaf).
        this.numElements = 0;    // Number of elements referenced by this node. If -1, this is a branch. Otherwise, this is a leaf.
        this.centerX     = 0;
        this.centerY     = 0;
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
    constructor()
    {
        this.elementIndex = -1;   // Index of the referenced SceneObject
        this.next = -1;           // Index of the next object node in the leaf
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
    constructor(scene, width, height, maxDepth = 3)
    {
        super();

        this.scene     = scene; 
        this.width     = width;
        this.height    = height;
        this.maxDepth  = maxDepth;
        this.quadNodes = [ new QuadTreeNode(width / 2, height / 2) ];
    }

    add(sceneObject)
    {
        let index = this.sceneObjects.indexOf(sceneObject);
        
        if(index == -1)
        {
            this.sceneObjects.push(sceneObject);
            this._insertObject(sceneObject);
        }
    }

    remove(sceneObject)
    {

    }

    update()
    {

    }

    _insertObject(sceneObject)
    {
        let toTraverse = [ { node: this.quadNodes[0] } ];

        while(toTraverse.length > 0)
        {
            if(toTraverse[0].numElements != -1)
            {
                // If this is a leaf
                this._addObjectToNode(toTraverse[0], sceneObject);
            }
            else
            {
                // This is a branch node. Check the children.
                //let nodeX = 
            }

            toTraverse.pop();
        }
    }

    _addObjectToNode(node, sceneObject)
    {

    }
}