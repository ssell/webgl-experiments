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
        this.buildFlatInstancedShader();
        this.buildDefaultMaterial();
        this.buildDefaultInstancedMaterial();
        this.buildQuadMesh();
    }

    start()
    {
        requestAnimationFrame(()=>this.frame());
    }

    buildFlatShader()
    {
        let shader = new Shader(this.renderer.context, shader_flat_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flat", shader);
    }

    buildFlatInstancedShader()
    {
        let shader = new Shader(this.renderer.context, shader_flat_vs_instanced, null, shader_flat_fs);
        this.renderer.shaders.set("flat_instanced", shader);
    }

    buildDefaultMaterial()
    {
        let material = new Material(this.renderer, "default", "flat");

        material.enableProperty("Color", 4, [1.0, 0.0, 1.0, 1.0],);

        this.renderer.materials.set("default", material);
    }

    buildDefaultInstancedMaterial()
    {
        let material = new Material(this.renderer, "default_instanced", "flat_instanced", true);

        material.enableProperty("Color", 4, [1.0, 1.0, 1.0, 1.0]);

        this.renderer.materials.set("default_instanced", material);
    }

    buildQuadMesh()
    {
        let quad = new Mesh();

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
