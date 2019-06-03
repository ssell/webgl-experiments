class RendererableComponent
{
    constructor(sceneObject, renderer)
    {
        this.parent             = sceneObject;
        this.id                 = -1;
        this.renderer           = renderer;
        this.context            = renderer.context;
        this.renderIndex        = -1;
        this._materialName      = this.context.resources.defaultMaterial;
        this._materialReference = this.context.resources.getMaterial(this._materialName);
        this._meshName          = this.context.resources.defaultMesh;
        this._meshReference     = this.context.resources.getMesh(this._meshName);
        this.materialProps      = new MaterialPropertyBlock(this);
        this.bucketIndex        = -1;
        this.bucketEntryIndex   = -1;
        this.aabb               = new BoundsAABB([0.0, 0.0, 0.0], [0.5, 0.5, 0.5]);
        
        this._materialReference.addRenderableReference(this);
    }

    set material(newMaterialName)
    {
        if(newMaterialName === this._materialName)
        {
            return true;
        }

        // Remove this renderable from the current material
        if(this._materialReference != null)
        {
            this._materialReference.removeRenderableReference(this);
        }

        // Get the new material
        this._materialName = newMaterialName;
        this._materialReference = this.context.resources.getMaterial(this._materialName);

        // Add this renderable to the new material
        if(this._materialReference != null)
        {
            this._materialReference.addRenderableReference(this);
            this.materialProps.map();
        }

        return (this._materialReference != null);
    }

    get material()
    {
        return this._materialName;
    }

    set mesh(newMeshName)
    {
        if(newMeshName === this._meshName)
        {
            return true;
        }

        this._meshName = newMeshName;
        this._meshReference = this.context.resources.getMesh(this._meshName);
        
        if((this._meshReference != null) && (this._materialReference != null))
        {
            this._materialReference.removeRenderableReference(this);
            this._materialReference.addRenderableReference(this);
        }

        return (_meshReference != null);
    }

    get mesh()
    {
        return this._meshName;
    }

    dispose()
    {
        if(this._materialReference != null)
        {
            this._materialReference.removeRenderableReference(this);
        }
    }
    
    update()
    {
        this._materialReference.updateRenderableReference(this);
    }
}

/**
 * Base representation of an object in the scene. Composed of:
 * 
 *     - Transform - Position, rotation, and scale.
 *     - Mesh      - Geometric definition of the visible model.
 *     - Shader    - How the mesh is rendered.
 */
class SceneObject
{
    constructor(renderer)
    {
        this.transform     = new Transform();
        this.renderable    = new RendererableComponent(this, renderer);
        this.visible       = true;
        this.materialProps = new MaterialPropertyBlock(this);
    }

    dispose()
    {
        this.renderable.dispose();
    }

    translate(x, y, z)
    {
        this.transform.translate(x, y, z);
        this.renderable.aabb.center = this.transform.position;
    }

    scale(x, y, z)
    {
        this.transform.scale = [x, y, z];
    }

    update(delta)
    {
        
    }

    preRender()
    {
        this.renderIndex = -1;
        this.renderable.renderer.addRenderObject(this);

        if(this.transform.mmDirty === true)
        {
            this.renderable.materialProps.setProperty(0, this.transform.modelMatrix);
        }

        this.renderable.update();
    }
}

class QuadObject extends SceneObject
{
    constructor(renderer)
    {
        super(renderer);

        this.renderable.material = this.renderable.context.resources.defaultInstancedMaterial;
        this.renderable.materialProps.setPropertyByName("Color", [Utils.getRandom(0, 1), Utils.getRandom(0, 1), Utils.getRandom(0, 1), 1.0]);
    }
}

class FlashingQuad extends QuadObject
{
    constructor(renderer, startColor = [0.0, 1.0, 0.0], endColor = [0.0, 0.0, 1.0])
    {
        super(renderer);

        this.renderable.material = "flash_instanced";

        this.renderable.materialProps.setPropertyByName("StartColor", [startColor[0], startColor[1], startColor[2], 1.0]);
        this.renderable.materialProps.setPropertyByName("EndColor", [endColor[0], endColor[1], endColor[2], 1.0]);
    }

    update(delta)
    {
        this.transform.translate(0.0, delta, 0.0);

        if(this.transform.position[1] > 20)
        {
            this.transform.translate(0.0, -40.0, 0.0);
        }
    }
}