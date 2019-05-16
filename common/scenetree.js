/**
 * 
 */
class SceneTree
{
    constructor()
    {
        this.scene = null;
    }

    destroy()
    {

    }

    setScene(scene)
    {
        this.scene = scene;
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