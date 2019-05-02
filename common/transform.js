/**
 * Represents the combination of a position, scale, and rotation to
 * fully express the placement and orientation of a SceneObject in a 3D world.
 */
class Transform
{
    _position    = [0.0, 0.0, 0.0];
    _scale       = [1.0, 1.0, 1.0];
    _rotation    = [0.0, 0.0, 0.0, 1.0];
    _modelMatrix = mat4.create();

    constructor()
    {
        this.mmDirty  = false;
    }

    set position(value)
    {
        this._position = value;
        this.mmDirty = true;
    }

    get position()
    {
        return this._position;
    }

    set scale(value)
    {
        this._scale = value;
        this.mmDirty = true;
    }

    get scale()
    {
        return this._scale;
    }

    set rotation(value)
    {
        this._rotation = value;
        this.mmDirty = true;
    }

    get rotation()
    {
        return this._rotation;
    }

    translate(x, y, z)
    {
        this._position[0] += x;
        this._position[1] += y;
        this._position[2] += z;
        this.mmDirty = true;
    }

    get modelMatrix()
    {
        if(this.mmDirty === true)
        {
            this._modelMatrix = mat4.create();
            mat4.translate(this._modelMatrix, this._modelMatrix, this._position);

            this.mmDirty = false;
        }

        return this._modelMatrix;
    }
}