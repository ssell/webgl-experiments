class SceneObject
{
    _mesh = null;
    _shader = null;

    constructor(renderer)
    {
        this.renderer = renderer;
        this.transform = new Transform();
    }

    set mesh(id)
    {
        this._mesh = this.renderer.meshes.getMesh(id);
    }

    set shader(id)
    {
        this._shader = this.renderer.shaders.getShader(id);
    }

    render(delta)
    {
        this.renderer.pushTransform(this.transform);
        this.renderer.render(delta, this._shader, this._mesh);
        this.renderer.popTransform();
    }
}