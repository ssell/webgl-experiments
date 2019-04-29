/**
 * Implementation of a SceneObject for use as a Camera.
 * The Renderer requires that it has a Camera object associated with it. See Renderer.camera.
 */
class Camera extends SceneObject
{
    _fov    = 45 * Math.PI / 180;
    _aspect = 0.0;
    _near   = 0.1;
    _far    = 100.0;

    constructor(renderer)
    {
        super(renderer);

        this._aspect = this.renderer.context.gl.canvas.clientWidth / this.renderer.context.gl.canvas.clientHeight;
        this.rebuildProjection();
    }

    clearColor(r, g, b)
    {
        this.renderer.context.setClearColor(r, g, b, 1.0);
    }

    set fieldOfView(value)
    {
        this._fov = value;
        this.rebuildProjection();
    }

    get fieldOfView()
    {
        return this._fov;
    }

    set aspectRatio(value)
    {
        this._aspect = value;
        this.rebuildProjection();
    }

    get aspectRatio()
    {
        return this._aspect;
    }

    set nearClip(value)
    {
        this._near = value;
        this.rebuildProjection();
    }

    get nearClip()
    {
        return this._near;
    }

    set farClip(value)
    {
        this._far = value;
        this.rebuildProjection();
    }

    get farClip()
    {
        return this._far;
    }

    rebuildProjection()
    {
        this.renderer.context.setProjectionPerspective(this._fov, this._aspect, this._near, this._far);
    }

    viewMatrix()
    {
        var view = this.modelMatrix();

        mat4.invert(view, view);

        return view;
    }
}