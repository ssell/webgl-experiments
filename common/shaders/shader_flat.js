const shader_flat_vs = shader_common_vs + `
    void main()
    {
        gl_Position = ProjectionMatrix * ModelViewMatrix * VertexPosition;
    }
`;

const shader_flat_fs = shader_common_fs + `
    void main()
    {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;