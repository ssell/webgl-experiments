const shader_quadtree_visualizer_vs = shader_common_vs + glsl`

    out vec4 FragmentWorldPos;

    void main()
    {
        gl_Position = transformPosition();
        FragmentWorldPos = ModelMatrix * VertexPosition;
    }
`;

const shader_quadtree_visualizer_fs = shader_common_fs + glsl`

    #define saturate(x) clamp(x, 0.0, 1.0)
    #define LineWidth 0.075

    // [ width, height, center x, center y ]
    uniform vec4 QuadTreeInfo;

    in vec4 FragmentWorldPos;

    float DistToLine(vec2 p, vec2 a, vec2 b)
    {
        vec2 pa = p - a;
        vec2 ba = b - a;
        
        float frac = saturate(dot(pa, ba) / dot(ba, ba));
        
        return length(pa - (ba * frac));
    }
    
    float Sharpen(float dist, float thickness, float blur)
    {
        float r = (1.0 / min(800.0, 600.0)) * blur;
        return smoothstep(r, -r, dist - thickness);
    }

    float Line(vec2 a, vec2 b)
    {
        return Sharpen(DistToLine(FragmentWorldPos.xy, a, b), LineWidth, 1.0);
    }

    // [ node x, node y, node depth, is leaf (0 or 1) ]
    vec4 GetNode(int index)
    {
        return texelFetch(sampler0, ivec2(index, 0), 0);
    }

    void main()
    {
        float numNodes = GetNode(0).x;
        float hWidth   = QuadTreeInfo.x * 0.5;
        float hHeight  = QuadTreeInfo.y * 0.5;
        float line     = 0.0;

        // Draw the borders around the entire QuadTree
        line = max(line, Line(vec2(-hWidth, -hHeight), vec2( hWidth, -hHeight)));
        line = max(line, Line(vec2( hWidth, -hHeight), vec2( hWidth,  hHeight)));
        line = max(line, Line(vec2( hWidth,  hHeight), vec2(-hWidth,  hHeight)));
        line = max(line, Line(vec2(-hWidth,  hHeight), vec2(-hWidth, -hHeight)));

        for(float i = 0.0; i < numNodes; ++i)
        {
            vec4 node = GetNode(int(i) + 1);

            float nodeHalfWidth  = QuadTreeInfo.x / pow(2.0, node.z);
            float nodeHalfHeight = QuadTreeInfo.y / pow(2.0, node.z);

            vec2 minHorizontal = vec2(node.x - nodeHalfWidth, node.y);
            vec2 maxHorizontal = vec2(node.x + nodeHalfWidth, node.y);
            vec2 minVertical   = vec2(node.x, node.y - nodeHalfHeight);
            vec2 maxVertical   = vec2(node.x, node.y + nodeHalfHeight);

            line = max(line, Line(minHorizontal, maxHorizontal));
            line = max(line, Line(minVertical, maxVertical));
        }

        fragColor = vec4(mix(vec3(0.098, 0.098, 0.196), vec3(0.3, 0.3, 0.45), line), 1.0);
    }
`;