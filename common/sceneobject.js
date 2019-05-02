/**
 * Base representation of an object in the scene. Composed of:
 * 
 *     - Transform - Position, rotation, and scale.
 *     - Mesh      - Geometric definition of the visible model.
 *     - Shader    - How the mesh is rendered.
 */
class SceneObject
{
    _mesh = "quad";
    _material = "default";

    constructor(renderer)
    {
        this.renderer      = renderer;
        this.renderIndex   = -1;
        this.transform     = new Transform();
        this.mesh          = "quad";
        this.material      = "default";
        this.visible       = true;
        this.materialProps = new MaterialPropertyBlock(this);
    }

    set mesh(id)
    {
        this._mesh = id;
    }

    get mesh()
    {
        return this._mesh;
    }

    set material(id)
    {
        this._material = id;
    }

    get material()
    {
        return this._material;
    }

    update(delta)
    {
        if(this.visible == true)
        {
            this.renderIndex = -1;
            this.renderer.addRenderObject(this);
        }
    }
}

class QuadObject extends SceneObject
{
    constructor(renderer)
    {
        super(renderer);

        this.material = "default_instanced";
        this.materialProps.setPropertyVec4("Color", [GetRandom(0, 1), GetRandom(0, 1), GetRandom(0, 1), 1.0]);
    }
}