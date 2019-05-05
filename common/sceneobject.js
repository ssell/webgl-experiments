class RendererableComponent
{
    constructor(sceneObject, renderer)
    {
        this.parent             = sceneObject;
        this.renderer           = renderer;
        this.renderIndex        = -1;
        this._materialName      = this.renderer.defaultMaterial;
        this._materialReference = this.renderer.materials.get(this._materialName);
        this._meshName          = this.renderer.defaultMesh;
        this._meshReference     = this.renderer.meshes.get(this.meshName);
        this.materialProps      = new MaterialPropertyBlock(this);
        this.bucketIndex        = -1;
        this.bucketEntryIndex   = -1;
        
        this._materialReference.addRenderableReference(this);
    }

    set material(newMaterialName)
    {
        if(newMaterialName === this._materialName)
        {
            return true;
        }

        if(!this.renderer.materials.has(newMaterialName))
        {
            return false;
        }

        this._materialReference.removeRenderableReference(this);
        
        this._materialName = newMaterialName;
        this._materialReference = this.renderer.materials.get(this._materialName);
        this._materialReference.addRenderableReference(this);
        this.materialProps.map();

        return true;
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

        if(!this.renderer.materials.has(newMeshName))
        {
            return false;
        }

        this._materialReference.removeRenderableReference(this);

        this._meshName = newMeshName;
        this._meshReference = this.renderer.meshes.get(this._meshName);
        this._materialReference.addRenderableReference(this);
    }

    get mesh()
    {
        return this._meshName;
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
        this.elapsed       = 0.0;
    }

    update(delta)
    {
        this.elapsed += delta;
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

        this.renderable.material = this.renderable.renderer.defaultInstancedMaterial;
        this.propColor = this.renderable.materialProps.getPropertyIndex("Color");
        this.renderable.materialProps.setProperty(this.propColor, [GetRandom(0, 1), GetRandom(0, 1), GetRandom(0, 1), 1.0]);
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
        super.update(delta);
    }
}