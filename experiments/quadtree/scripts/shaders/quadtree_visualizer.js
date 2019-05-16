const shader_quadtree_visualizer_vs = shader_common_vs + `

    void main()
    {
        gl_Position = transformPosition();
    }
`;

const shader_quadtree_visualizer_fs = shader_common_fs + `

    void main()
    {
        gl_FragColor = vec4(1.0, 0.3, 0.3, 1.0);
    }
`;