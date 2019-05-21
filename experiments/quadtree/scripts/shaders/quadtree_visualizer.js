const shader_quadtree_visualizer_vs = shader_common_vs + glsl`

    void main()
    {
        gl_Position = transformPosition();
    }
`;

const shader_quadtree_visualizer_fs = shader_common_fs + glsl`

    // (qt width, qt height, num nodes, 0.0)
    vec4 getQuadTreeInfo()
    {
        return texelFetch(sampler0, ivec2(0, 0), 0);
    }
    void main()
    {
        vec4 qtInfo = getQuadTreeInfo();
        fragColor = vec4(0.0, qtInfo.z / 10.0, 0.0, 1.0);
    }
`;