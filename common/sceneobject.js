/**
 * Base representation of an object in the scene. Composed of:
 * 
 *     - Transform - Position, rotation, and scale.
 *     - Mesh      - Geometric definition of the visible model.
 *     - Shader    - How the mesh is rendered.
 */
class SceneObject
{
    _material = "";

    constructor(renderer)
    {
        this.renderer  = renderer;
        this.transform = new Transform();
        this.mesh      = "quad";
        this.material  = "default";
        this.visible   = true;
    }

    dispose()
    {
        material = "";
    }

    set material(id)
    {
        let prevMaterial = this.renderer.materials.get(this.material);
        let nextMaterial = this.renderer.materials.get(id);

        if(prevMaterial != null)
        {
            prevMaterial.disassociate(this);
        }

        if(nextMaterial != null)
        {
            nextMaterial.associate(this);
        }

        this._material = id;
    }

    get material()
    {
        return this._material;
    }

    translate(x, y, z)
    {
        this.transform.position[0] += x;
        this.transform.position[1] += y;
        this.transform.position[2] += z;
    }

    modelMatrix()
    {
        var model = mat4.create();

        mat4.translate(model, model, this.transform.position);

        return model;
    }

    update(delta)
    {
        if(this.visible == true)
        {
            this.renderer.addRenderObject(this);
        }
    }
}