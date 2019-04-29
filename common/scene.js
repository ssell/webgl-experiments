/**
 * Contains and manages the objects which compose a visual scene.
 */
class Scene
{
    constructor(canvasId)
    {
        this.renderer      = new Renderer(canvasId);
        this.sceneObjects  = [];
        this.frameStats    = new FrameStats();
        this.lastFrameTime = 0.0;
        this.deltaTime     = 0.0;
    }

    setup()
    {
        this.buildFlatShader();
        this.buildFlatMaterial();
        this.buildQuadMesh();
    }

    start()
    {
        requestAnimationFrame(()=>this.frame());
    }

    buildFlatShader()
    {
        var shader = new Shader(this.renderer.context, shader_flat_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flat", shader);
    }

    buildFlatMaterial()
    {
        var material = new Material(this.renderer, "default", "flat");

        material.setUniformVec4("Color", [1.0, 0.0, 1.0, 1.0]);

        this.renderer.materials.set("default", material);
    }

    buildQuadMesh()
    {
        var quad = new Mesh();

        quad.vertices.push(new Vertex(-0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0), 
                           new Vertex( 0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0), 
                           new Vertex( 0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0),
                           new Vertex(-0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0));

        quad.indices.push(0, 1, 2, 
                          2, 3, 0)

        quad.build(this.renderer.context);

        this.renderer.meshes.set("quad", quad);
    }

    frame(elapsedTime)
    {
        if(isNaN(elapsedTime))
        {
            elapsedTime = performance.now();
        }

        elapsedTime *= 0.001;                   // Convert to ms

        this.deltaTime = elapsedTime - this.lastFrameTime;
        this.lastFrameTime = elapsedTime;

        for(var i = 0; i < this.sceneObjects.length; ++i)
        {
            var sceneObject = this.sceneObjects[i];
            sceneObject.update(this.deltaTime);
        }

        var drawCalls = this.renderer.drawScene(this.deltaTime);

        this.frameStats.addFrame(this.deltaTime, drawCalls);
        this.frameStats.report();

        requestAnimationFrame(()=>this.frame());
    }
}
