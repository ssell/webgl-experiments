/**
 * Implementation of a SceneObject for use as a Camera.
 * The Renderer requires that it has a Camera object associated with it. See `Renderer.camera`.
 */
class Camera extends SceneObject
{
    _fov    = 45 * Math.PI / 180;
    _aspect = 0.0;
    _near   = 0.1;
    _far    = 500.0;

    constructor(renderer)
    {
        super(renderer);

        this._aspect = this.renderable.renderer.context.gl.canvas.clientWidth / this.renderable.renderer.context.gl.canvas.clientHeight;
        this.rebuildProjection();
    }

    clearColor(r, g, b)
    {
        this.renderable.renderer.context.setClearColor(r, g, b, 1.0);
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

    /**
     * Converts screen space coordinates to clip space.
     * Returns the clip position as an array [x, y].
     * 
     * @param {*} screenX 
     * @param {*} screenY 
     */
    screenToClip(screenX, screenY)
    {
        return [ screenX / this.renderable.renderer.context.gl.canvas.width  *  2 - 1,
                 screenY / this.renderable.renderer.context.gl.canvas.height * -2 + 1 ];
    }

    /**
     * Calculates the world positions of the specified screen space position.
     * Returns the world position as an array [x, y , z].
     * 
     * @param {*} screenX X-position in screen-space.
     * @param {*} screenY Y-position in screen-space.
     * @param {*} zOffset Z (depth) offset from the camera's near clip in world units.
     */
    screenToWorld(screenX, screenY, zOffset = 0.0)
    {
        let worldPos = [0.0, 0.0, 0.0];
        let depthPos = [0.0, 0.0, zOffset];

        const viewMatrix     = this.viewMatrix();
        const projMatrix     = this.renderable.renderer.context.projectionMatrix;
        const viewProjMatrix = mat4.create();
        const clipPos        = this.screenToClip(screenX, screenY);

        // Create and invert the view-projection matrix
        mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);
        mat4.invert(viewProjMatrix, viewProjMatrix);

        // Transform the requested z offset to clip space
        vec3.transformMat4(depthPos, depthPos, projMatrix);

        // Transform the clip space position to world space
        vec3.transformMat4(worldPos, [clipPos[0], clipPos[1], depthPos[2]], viewProjMatrix);

        return worldPos;
    }

    screenToRay(screenX, screenY)
    {
        let near = this.screenToWorld(screenX, screenY, 0.0);
        let far  = this.screenToWorld(screenX, screenY, -10.0);
        let dir  = [ 0.0, 0.0, 0.0 ];

        vec3.subtract(dir, far, near);
        vec3.normalize(dir, dir);

        return new Ray(near, dir);
    }

    rebuildProjection()
    {
        this.renderable.renderer.context.setProjectionPerspective(this._fov, this._aspect, this._near, this._far);
    }

    viewMatrix()
    {
        var view = Float32Array.from(this.transform.modelMatrix);

        mat4.invert(view, view);

        return view;
    }
}