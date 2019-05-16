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
        this._modelMatrix[12] = value[0];
        this._modelMatrix[13] = value[1];
        this._modelMatrix[14] = value[2];

        this.mmDirty = true;
    }

    get position()
    {
        return [this._modelMatrix[12], this._modelMatrix[13], this._modelMatrix[14]]
    }

    set scale(value)
    {
        this._scale = value;
        mat4.scale(this._modelMatrix, this._modelMatrix, value);
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
        this._modelMatrix[12] += x;
        this._modelMatrix[13] += y;
        this._modelMatrix[14] += z;

        this.mmDirty = true;
    }

    get modelMatrix()
    {
        this.mmDirty = false;
        return this._modelMatrix;
    }
}