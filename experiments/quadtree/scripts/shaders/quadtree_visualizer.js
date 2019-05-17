const shader_quadtree_visualizer_vs = shader_common_vs + glsl`

    void main()
    {
        gl_Position = transformPosition();
    }
`;

const shader_quadtree_visualizer_fs = shader_common_fs + glsl`

    void main()
    {
        vec3 fetch = texture2D(sampler0, vec2(0.0, 0.0)).rgb;
        gl_FragColor = vec4(fetch.rgb, 1.0);
    }
`;