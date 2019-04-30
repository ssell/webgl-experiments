/**
 * Represents the combination of a position, scale, and rotation to
 * fully express the placement and orientation of a SceneObject in a 3D world.
 */
class Transform
{
    constructor()
    {
        this.position = [0.0, 0.0, 0.0];
        this.scale    = [1.0, 1.0, 1.0];
        this.rotation = [0.0, 0.0, 0.0, 1.0];
    }
}