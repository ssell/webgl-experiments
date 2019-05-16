var scene = null;

function createQuadTreeVisualizerMaterial()
{
    new Shader(scene.renderer.context, "quadtree_visualizer_shader", shader_quadtree_visualizer_vs, null, shader_quadtree_visualizer_fs);
    new Material(scene.renderer, "quadtree_visualizer", "quadtree_visualizer_shader");
}

function setupScene()
{
    scene = new Scene("glCanvas");

    scene.setSceneTree(new QuadTree(50, 50, 0, 0, 8));
    scene.setup();
    
    scene.renderer.camera.clearColor(0.098, 0.098, 0.196);
    scene.renderer.camera.transform.translate(0.0, 0.0, 50.0);

    createQuadTreeVisualizerMaterial();
    scene.addSceneObject(new QuadTreeDebugObject(scene.renderer, scene.sceneTree));

    spawnQuad();

    scene.start();
}

function spawnQuad()
{
    let quad = new QuadObject(scene.renderer);
    quad.translate(Utils.getRandom(-25, 25), Utils.getRandom(-25, 25), 0);
    scene.addSceneObject(quad);
}

function updateTreeOutput()
{
    $("#tree_output").html(scene.sceneTree.debugTraverse());
}

$(document).ready(function()
{
    setupScene();
    updateTreeOutput();

    $("#spawn_quad").click(function()
    {
        spawnQuad();
        updateTreeOutput();
    })

    $("#output_tree").click(function()
    {
        updateTreeOutput();
    });
});