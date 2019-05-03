/**
 * Minimal wrapper around a Float32Array and manages the data within it.
 * 
 * All operations, except for `remove`, are O(1).
 * The `remove` operation is O(n).
 */
class PropertyBucket
{
    constructor(context, entrySize, entryCapacity)
    {
        this.entrySize     = entrySize;       // Number of floats in an individual entry
        this.entryCapacity = entryCapacity;   // Maximum number of entries that can be held in this bucket
        this.entryCount    = 0;               // Current number of entries held in this bucket
        this.entryData     = new Float32Array(entrySize * entryCapacity);
        this.dataBuffer    = context.gl.createBuffer();
        this.dirty         = true;
    }

    bind(context)
    {
        context.gl.bindBuffer(context.gl.ARRAY_BUFFER, this.dataBuffer);

        if(this.dirty === true)
        {
            context.gl.bufferData(context.gl.ARRAY_BUFFER, this.entryData, context.gl.STATIC_DRAW);
            this.dirty = false;
        }
    }
    
    /**
     * Returns true if the bucket has room for more entries.
     */
    isOpen()
    {
        return (this.entryCount < this.entryCapacity);
    }

    /**
     * Sets the entry at the specified index.
     * 
     * NOTE: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    set(entryIndex, value)
    {
        // Note we manually set the values as using the provided Float32Array.set()
        // method was found to be significantly slower (up to 39%!). See below:
        // https://jsperf.com/float32array-performance-set/1

        let start = (entryIndex * this.entrySize);
        
        for(let i = 0; i < this.entrySize; ++i)
        {
            this.entryData[start + i] = value[i];
        }

        this.dirty = true;
    }

    /**
     * Returns the entry at the specified index.
     * 
     * NOTE: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    get(entryIndex)
    {
        let result = [];

        for(let i = 0; i < this.entrySize; ++i)
        {
            result.push(this.entryData[entryIndex + i]);
        }
    }

    /**
     * Removes the specified entry from the bucket.
     * 
     * NOTE 1: The capacity of the bucket does not change, and the underlying
     * `entryData` array is not re-allocated.
     * 
     * NOTE 2: This does not perform any checks to ensure that the specified
     * entry index is valid. As the owning `MaterialBucketHolder` is responsible
     * for performing all sanity checks. This is to reduce conditionals.
     * 
     * @param {*} entryIndex 
     */
    remove(entryIndex)
    {
        let start = (entryIndex * this.entrySize);

        // Shift the entire contents to the left one entry
        for(let i = start; i < this.entryCapacity; ++i)
        {
            this.entryData[i - this.entrySize] = this.entryData[i];
        }

        this.entryCount--;
        this.dirty = true;
    }

    /**
     * Adds the value to the bucket at the next available location.
     * 
     * NOTE 1: The capacity of the bucket does not change, and the underlying
     * `entryData` array is not re-allocated.
     * 
     * NOTE 2: This does not perform any checks to ensure that there is an open space.
     * This is to reduce the number of conditionals that must be performed. Consider
     * a `MaterialBucketHolder` that contains 10 `PropertyBucket`s. The owning 
     * `MaterialBucketHolder` is responsible for ensuring all of its buckets are in
     * sync with each other and thus only has to check once for all 10 properties.
     * 
     * @param {*} value 
     */
    add(value)
    {
        // Set the value to the next open index
        this.set(this.entryCount++, value);
    }
}

class MaterialBucketHolder
{
    constructor(material)
    {
        this.parent              = material;
        this.context             = this.parent.renderer.context;
        this.properties          = this.parent.properties;
        this.propertyBuckets     = [];    // [property index] = [ bucket0, bucket1, bucket2, ...]
        this.renderables         = [];    // [propertyBlock.bucketIndex][propertyBlock.bucketEntryIndex] = propertyBlock
        this.maxEntriesPerBucket = this.parent.renderer.instanceSize;

        // Add the initial bucket
        this.addBucket();
    }

    clone()
    {

    }

    bind(instanceIndex)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let buckets = this.propertyBuckets[i];

            if(buckets.length <= instanceIndex)
            {
                break;
            }

            // Bind the individual property data buffer to the active ARRAY_BUFFER
            buckets[instanceIndex].bind(this.context);

            // Set the attribute pointers
            switch(property.size)
            {
                case 1:    // float
                case 2:    // vec2
                case 3:    // vec3
                case 4:    // vec4
                    this.context.gl.vertexAttribPointer(property.location, property.size, this.context.gl.FLOAT, false, 0, 0);
                    this.context.gl.enableVertexAttribArray(property.location);
                    this.context.gl.vertexAttribDivisor(property.location, 1);
                    break;

                case 9:    // mat3
                    this.context.gl.vertexAttribPointer(property.location + 0, 4, this.context.gl.FLOAT, false, 36, 0);     // 3 columns, 12 bytes per column
                    this.context.gl.vertexAttribPointer(property.location + 1, 4, this.context.gl.FLOAT, false, 36, 12);
                    this.context.gl.vertexAttribPointer(property.location + 2, 4, this.context.gl.FLOAT, false, 36, 24);
                    
                    this.context.gl.enableVertexAttribArray(property.location + 0);
                    this.context.gl.enableVertexAttribArray(property.location + 1);
                    this.context.gl.enableVertexAttribArray(property.location + 2);

                    this.context.gl.vertexAttribDivisor(property.location + 0, 1);
                    this.context.gl.vertexAttribDivisor(property.location + 1, 1);
                    this.context.gl.vertexAttribDivisor(property.location + 2, 1);
                    break;

                case 16:   // mat4
                    this.context.gl.vertexAttribPointer(property.location + 0, 4, this.context.gl.FLOAT, false, 64, 0);     // 4 columns, 16 bytes per column
                    this.context.gl.vertexAttribPointer(property.location + 1, 4, this.context.gl.FLOAT, false, 64, 16);
                    this.context.gl.vertexAttribPointer(property.location + 2, 4, this.context.gl.FLOAT, false, 64, 32);
                    this.context.gl.vertexAttribPointer(property.location + 3, 4, this.context.gl.FLOAT, false, 64, 48);
                    
                    this.context.gl.enableVertexAttribArray(property.location + 0);
                    this.context.gl.enableVertexAttribArray(property.location + 1);
                    this.context.gl.enableVertexAttribArray(property.location + 2);
                    this.context.gl.enableVertexAttribArray(property.location + 3);

                    this.context.gl.vertexAttribDivisor(property.location + 0, 1);
                    this.context.gl.vertexAttribDivisor(property.location + 1, 1);
                    this.context.gl.vertexAttribDivisor(property.location + 2, 1);
                    this.context.gl.vertexAttribDivisor(property.location + 3, 1);
                    break;
            }
        }
    }

    add(renderable)
    {
        let bucketIndex = -1;
        let checkBuckets = this.propertyBuckets[0];

        // Find the first bucket with free space
        for(let i = 0; i < checkBuckets.length; ++i)
        {
            if(checkBuckets[i].isOpen())
            {
                bucketIndex = i;
                break;
            }
        }

        // All buckets are full so we need to add another
        if(bucketIndex == -1)
        {
            bucketIndex = checkBuckets.length;
            this.addBucket();
        }

        // Add the property values to the bucket
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let value = renderable.materialProps.getPropertyValue(i, property.default);
            let bucket = this.propertyBuckets[i][bucketIndex];

            if(value.length != bucket.entrySize)
            {
                console.error("Mismatch in property block value length (" + value.length + ") for '" + property.name + "' and expected size (" + bucket.entrySize + ") in bucket");
                continue;
            }

            if(i === 0)
            {
                renderable.bucketEntryIndex = bucket.entryCount;
            }

            bucket.add(value);
        }

        // Update the property block's local record of where it resides
        renderable.materialProps.dirty = false;
        renderable.bucketIndex         = bucketIndex;
        renderable.bucketEntryIndex    = this.renderables[bucketIndex].length;
        
        // Update the holder's record of where the property block resides
        this.renderables[renderable.bucketIndex].push(renderable);
    }

    addBucket()
    {
        // Create a new bucket for each property
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            this.addBucketForProperty(property, i);
        }

        // Create a new array of property blocks for this bucket
        this.renderables.push([]);
    }

    addBucketForProperty(property, index)
    {
        let buckets = [];
            
        // If this is the first bucket for the specified property create the map entry
        if(this.propertyBuckets.length <= index)
        {
            this.propertyBuckets.push([]);
            buckets = this.propertyBuckets[index];
        }
        else
        {
            buckets = this.propertyBuckets[index];
        }

        // Add the new bucket
        let bucket = new PropertyBucket(this.context, property.size, this.maxEntriesPerBucket);
        buckets.push(bucket);

        return bucket;
    }

    /**
     * Adds a new property. 
     * 
     * This involves creating the same number of buckets as are present in the other properties, 
     * and then filling the new buckets with data from the tracked renderables.
     * 
     * @param {*} property 
     */
    addProperty(property)
    {
        for(let bucketIndex = 0; bucketIndex < this.renderables.length; ++bucketIndex)
        {
            let propertyIndex = this.properties.length - 1; // The property has already been added to the parent
                                                            // material's property array. So reference the last index.

            let bucket = this.addBucketForProperty(property, propertyIndex);

            // Add an entry for each tracked renderable with the same bucket index
            for(let bucketEntryIndex = 0; bucketEntryIndex < this.renderables[bucketIndex].length; ++bucketEntryIndex)
            {
                let renderable = this.renderables[bucketIndex][bucketEntryIndex];
                let value = renderable.materialProps.getPropertyValue(propertyIndex, property.default);

                bucket.set(bucketEntryIndex, value);
            }
        }
    }

    remove(renderable)
    {
        // Remove the property values from each affected bucket
        for(let i = 0; i < this.properties.length; ++i)
        {
            let bucket = this.propertyBuckets[i][renderable.bucketIndex];
            bucket.remove(renderable.bucketEntryIndex);
        }

        // Remove the property block from the holder's record of where it resides
        this.renderables[renderable.bucketIndex].splice(renderable.bucketEntryIndex, 1);

        // Update property blocks that were shifted
        for(let i = renderable.bucketEntryIndex; i < this.renderables[renderable.bucketIndex].length; ++i)
        {
            this.renderables[renderable.bucketIndex][i].bucketEntryIndex = i;
        }

        // Update the removed property block
        renderable.bucketIndex      = -1;
        renderable.bucketEntryIndex = -1;
    }

    update(renderable)
    {
        if(renderable.materialProps.dirty === false)
        {
            return;
        }

        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let value    = renderable.materialProps.getPropertyValue(i, property.default);
            let bucket   = this.propertyBuckets[i][renderable.bucketIndex];

            bucket.set(renderable.bucketEntryIndex, value);
        }

        renderable.materialProps.dirty = false;
    }
}

/**
 * Individual record of an overridable material property.
 * 
 * If a material is instanced then this property is an `attribute`,
 * otherwise it is a `uniform`. The `default` value is used only
 * if the currently rendered SceneObject does not provide a valid
 * override value in it's `materialProps` member. 
 */
class MaterialPropertyRecord
{
    constructor(context, name, defaultValue, size, location)
    {
        this.name     = name;
        this.default  = defaultValue;
        this.size     = size;
        this.location = location;
        this.buffer   = context.gl.createBuffer();
    }
}

/**
 * A material handles the mapping of a shader with user defined input.
 * There are two classes of input: Uniforms and Properties.
 * 
 * Uniforms, regardless of the material type, are values that are constant
 * for the entire binding of the material. They are represented in the GLSL
 * shader by the `uniform` type.
 * 
 * Properties may either resolve to a GLSL `uniform` or to an `attribute`
 * depending on the material type. If a material is instanced, then properties
 * are expected to be represented in the GLSL by an `attribute`. If the material
 * is not instanced then it is expected to be a `uniform`.
 * 
 * A property must first be enabled on the material, via `enableProperty`. The
 * value of the property passed to the bound shader will then be based on whether
 * a matching property value is set in the SceneObject's MaterialPropertyBlock 
 * member (`materialProps`). If a match is found, then that value is used.
 * Otherwise the default value specified in the `enableProperty` call is used.
 * 
 * Materials also handle the binding of the common shader variables:
 * 
 *     - ViewMatrix (Uniform)
 *     - ProjectionMatrix (Uniform)
 *     - ModelMatrix (Uniform or Attribute depending on if the material is instanced)
 *     - VertexPosition (Attribute)
 *     - VertexColor (Attribute)
 *     - VertexNormal (Attribute)
 *     - VertexUV (Attribute)
 */
class Material
{
    constructor(renderer, materialName, shaderName, instanced = false)
    {
        this.renderer        = renderer;
        this.name            = materialName;
        this.shader          = renderer.shaders.get(shaderName);
        this._instanced      = instanced;
        this.uniforms        = new Map();
        this.references      = 0;
        this.properties      = [];
        this.propertyBuckets = new Map();
        
        this.addPropertyBucket(this.renderer.defaultMesh);
        this.enableProperty("ModelMatrix", 16, mat4.create());
    }

    get instanced()
    {
        return this._instanced;
    }

    addPropertyBucket(meshName)
    {
        if(this.propertyBuckets.has(meshName))
        {
            return;
        }

        this.propertyBuckets.set(meshName, new MaterialBucketHolder(this));
    }

    addPropertyBucketProperty(property)
    {
        let propertyBucketIter = this.propertyBuckets.keys();
        let propertyBucketEntry = propertyBucketIter.next();

        // So for each MaterialPropertyHolder we have (one for each used mesh)
        while(!propertyBucketEntry.done)
        {
            // Add the new property to it
            let propertyBucket = this.propertyBuckets.get(propertyBucketEntry.value);
            propertyBucket.addProperty(property);
            propertyBucketEntry = propertyBucketIter.next();
        }
    }

    addRenderableReference(renderable)
    {
        if(!this.instanced)
        {
            return;
        }

        this.addPropertyBucket(renderable.mesh);
        this.propertyBuckets.get(renderable.mesh).add(renderable);
    }

    removeRenderableReference(renderable)
    {
        if(!this.instanced)
        {
            return;
        }

        if(!this.propertyBuckets.has(renderable.mesh))
        {
            return;
        }

        this.propertyBuckets.get(renderable.mesh).remove(renderable);
    }

    updateRenderableReference(renderable)
    {
        if(!this.instanced)
        {
            return;
        }
        
        if(!renderable.materialProps.dirty)
        {
            return;
        }

        this.addPropertyBucket(renderable.mesh);
        this.propertyBuckets.get(renderable.mesh).update(renderable);
    }

    /**
     * Enables the binding of the specified property for the material.
     * 
     * If the material is instanced then the property must match with an `attribute` in the shader.
     * Otherwise, the property must match with a `uniform` in the shader.
     * 
     * If there is no match in the shader, then the property is not used.  Otherwise, there is a match 
     * in the shader, but not in the rendered SceneObject's `materialProps` then the default value provided is used.
     * 
     * @param {*} name Name of the property which must have a match in the underlying shader.
     * @param {*} size Size of the property, in elements (floats).
     * @param {*} defaultValue Default value of the property if not overriden by the SceneObject.
     */
    enableProperty(name, size, defaultValue)
    {
        if(this.properties.indexOf(name) != -1)
        {
            return;
        }

        let location = -1;

        if(!this.instanced)
        {
            location = this.renderer.context.gl.getUniformLocation(this.shader.shaderProgram, name);
        }
        else
        {
            location = this.renderer.context.gl.getAttribLocation(this.shader.shaderProgram, name);
            
        }

        let property = new MaterialPropertyRecord(this.renderer.context, name, defaultValue, size, location);
        this.properties.push(property);
        
        if(this.instanced)
        {
            this.addPropertyBucketProperty(property);
        }
    }

    /**
     * Disables the binding of the specified property.
     * @param {*} name 
     */
    disableProperty(name)
    {
        let index = this.properties.indexOf(name);

        if(index != -1)
        {
            this.properties.splice(index, 1);
        }
    }

    /**
     * Sets the value of the specified `uniform float`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformFloat(name, value)
    {
        this.setUniform(name, value, 1, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec2`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec2(name, value)
    {
        this.setUniform(name, value, 2, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec3`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec3(name, value)
    {
        this.setUniform(name, value, 3, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform vec4`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformVec4(name, value)
    {
        this.setUniform(name, value, 4, this.renderer.context.gl.FLOAT);
    }

    /**
     * Sets the value of the specified `uniform mat4`.
     * 
     * @param {*} name 
     * @param {*} value 
     */
    setUniformMat4(name, value)
    {

    }

    /**
     * For internal use. Or you can use it if the pre-supplied `setUniform*` methods aren't cutting it.
     * 
     * @param {*} name 
     * @param {*} value 
     * @param {*} size 
     * @param {*} type 
     */
    setUniform(name, value, size, type)
    {
        this.uniforms.set(name, new MaterialPropertyUniform(this.shader, name, value, type, size, this.renderer.context));
    }

    /**
     * Binds the underlying shader as the active shader, and then assigns the defined uniform and attribute properties.
     * This should be used only for non-instanced materials. For instanced rendering, use `bindInstanced`.
     * 
     * @param {*} context 
     * @param {*} sceneObject Individual SceneObject which will be rendered with this material.
     */
    bind()
    {
        if(this.shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this.shader.bind(this.renderer.context))
        {
            return false;
        }

        this.bindUniforms();

        return true;
    }

    bindInstanced(meshName, instanceIndex)
    {
        let propertyBucket = this.propertyBuckets.get(meshName);

        if(propertyBucket === undefined)
        {
            return false;
        }

        propertyBucket.bind(instanceIndex);
    }

    /**
     * Binds the underlying shader as the active shader, and then assigns the defined uniform and attribute properties.
     * This should be used only for instanced materials. For non-instanced rendering, use `bind`.
     * 
     * This separation is due to the fact that in non-instanced rendering we simply bind the uniforms in this call
     * and return whether that operation was successful or not.
     * 
     * However for instanced rendering (this method) we are responsible for also updating the instaced data buffers
     * for our shader program.
     * 
     * @param {*} context 
     * @param {*} sceneObjects Array of SceneObjects that will be rendered with this material in this instance.
     */
    bindInstancedOld(context, sceneObjects)
    {
        if(this.shader == null)
        {
            console.error("Attempting to bind material with undefined shader");
            return false;
        }

        if(!this.shader.bind(this.renderer.context))
        {
            return false;
        }

        this.bindUniforms();

        // Naive approach first and then we will optimize...

        // Each property already has a glBuffer allocated for it.
        // So we need to go through each scene object and build up the data array for it.
        // Once through all scene objects we can fill the buffer data and then discard the data array.
        // Then finally we bind the property buffers.

        let propertyCount = this.properties.length;
        let propertyArrays = [];

        for(let i = 0; i < propertyCount; ++i)
        {
            propertyArrays.push([]);
        }

        // Build up the data arrays
        for(let i = 0; i < sceneObjects.length; ++i)
        {
            let values = sceneObjects[i].renderable.materialProps.fetchProperties(this.properties);

            for(let j = 0; j < propertyCount; ++j)
            {
                propertyArrays[j].push.apply(propertyArrays[j], values[j]);
            }
        }

        // Bind the data to the buffers
        for(let i = 0; i < propertyCount; ++i)
        {
            let property = this.properties[i];

            if(property.location == -1)
            {
                continue;
            }

            let float32Array = Float32Array.from(propertyArrays[i]);

            context.gl.bindBuffer(context.gl.ARRAY_BUFFER, property.buffer);
            context.gl.bufferData(context.gl.ARRAY_BUFFER, float32Array, context.gl.STATIC_DRAW);

            switch(property.size)
            {
                case 1:    // float
                case 2:    // vec2
                case 3:    // vec3
                case 4:    // vec4
                    context.gl.vertexAttribPointer(property.location, property.size, context.gl.FLOAT, false, 0, 0);
                    context.gl.enableVertexAttribArray(property.location);
                    context.gl.vertexAttribDivisor(property.location, 1);
                    break;

                case 9:    // mat3
                    context.gl.vertexAttribPointer(property.location + 0, 4, context.gl.FLOAT, false, 36, 0);     // 3 columns, 12 bytes per column
                    context.gl.vertexAttribPointer(property.location + 1, 4, context.gl.FLOAT, false, 36, 12);
                    context.gl.vertexAttribPointer(property.location + 2, 4, context.gl.FLOAT, false, 36, 24);
                    
                    context.gl.enableVertexAttribArray(property.location + 0);
                    context.gl.enableVertexAttribArray(property.location + 1);
                    context.gl.enableVertexAttribArray(property.location + 2);

                    context.gl.vertexAttribDivisor(property.location + 0, 1);
                    context.gl.vertexAttribDivisor(property.location + 1, 1);
                    context.gl.vertexAttribDivisor(property.location + 2, 1);
                    break;

                case 16:   // mat4
                    context.gl.vertexAttribPointer(property.location + 0, 4, context.gl.FLOAT, false, 64, 0);     // 4 columns, 16 bytes per column
                    context.gl.vertexAttribPointer(property.location + 1, 4, context.gl.FLOAT, false, 64, 16);
                    context.gl.vertexAttribPointer(property.location + 2, 4, context.gl.FLOAT, false, 64, 32);
                    context.gl.vertexAttribPointer(property.location + 3, 4, context.gl.FLOAT, false, 64, 48);
                    
                    context.gl.enableVertexAttribArray(property.location + 0);
                    context.gl.enableVertexAttribArray(property.location + 1);
                    context.gl.enableVertexAttribArray(property.location + 2);
                    context.gl.enableVertexAttribArray(property.location + 3);

                    context.gl.vertexAttribDivisor(property.location + 0, 1);
                    context.gl.vertexAttribDivisor(property.location + 1, 1);
                    context.gl.vertexAttribDivisor(property.location + 2, 1);
                    context.gl.vertexAttribDivisor(property.location + 3, 1);
                    break;
            }
        }
    }

    /**
     * Cleans up actions done during `bindInstanced` so future materials are not affected.
     * 
     * @param {*} context 
     */
    unbindInstanced(context)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let propertyLocationCount = property.size / 4;

            for(let j = 0; j < propertyLocationCount; ++j)
            {
                context.gl.vertexAttribDivisor(property.location + j, 0);
            }
        }
    }

    /**
     * Binds the values for the GLSL `uniform` variables.
     * These are set via the `setUniform*` family of methods.
     */
    bindUniforms()
    {
        let uniformIter = this.uniforms.keys();
        let uniform = uniformIter.next();

        while(!uniform.done)
        {
            this.uniforms.get(uniform.value).bind();
            uniform = uniformIter.next();
        }
    }

    /**
     * Binds our properties for a non-instanced material - they are bound as `uniform`s.
     * 
     * @param {*} sceneObject 
     */
    bindNonInstancedProperties(sceneObject)
    {
        for(let i = 0; i < this.properties.length; ++i)
        {
            let property = this.properties[i];
            let value  = sceneObject.renderable.materialProps.getPropertyValue(i, property.default);
            
            switch(property.size)
            {
                case 1:
                this.renderer.context.gl.uniform1fv(property.location, value);
                break;

                case 2:
                this.renderer.context.gl.uniform2fv(property.location, value);
                break;

                case 3:
                this.renderer.context.gl.uniform3fv(property.location, value);
                break;

                case 4:
                this.renderer.context.gl.uniform4fv(property.location, value);
                break;

                case 16:
                this.renderer.context.gl.uniformMatrix4fv(property.location, false, value);
                break;
            }
        }
    }
}

/**
 * Represents a single `uniform` property for the material.
 * 
 * Note that these will always be represented as a `uniform` 
 * in the underlying shader, unlike those set in `enableProperty`.
 */
class MaterialPropertyUniform
{
    constructor(shader, name, value, type, size, context)
    {
        this.context  = context;
        this.name     = name;
        this.value    = value;
        this.type     = type;
        this.size     = size;
        this.location = context.gl.getUniformLocation(shader.shaderProgram, this.name);
    }

    bind()
    {
        if(this.location == -1)
        {
            return;
        }
        
        switch(this.size)
        {
            case 1:
            this.context.gl.uniform1fv(this.location, this.value);
            break;

            case 2:
            this.context.gl.uniform2fv(this.location, this.value);
            break;

            case 3:
            this.context.gl.uniform3fv(this.location, this.value);
            break;

            case 4:
            this.context.gl.uniform4fv(this.location, this.value);
            break;
        }
    }
}

/**
 * Represent a single entry in a `MaterialPropertyBlock`.
 */
class MaterialPropertyBlockRecord
{
    constructor(name, value, size, type)
    {
        this.name  = name;
        this.value = value;
        this.size  = size;
        this.type  = type;
    }
}

/**
 * Used by a `SceneObject` to provide optional overrides to material properties.
 * 
 * This allows for per-object specification of a shader input value, regardless
 * of whether the object is being rendered individually or grouped in an instance.
 * 
 * Note: if a per-material property is desired instead, then the `Material.setUniform*`
 * family of methods should be used.
 */
class MaterialPropertyBlock
{
    constructor(renderableComponent)
    {
        this.parent           = renderableComponent;
        this.properties       = new Map();
        this.dirty            = true;
        this.propertyNames  = [];
        this.propertyValues = [];

        this.map();
    }

    /**
     * Maps the property block to the currently referenced material in the parent `RenderableComponent`.
     * 
     * Note that this is a potentially destructive operation. If the previously mapped material defined
     * a property `foo`, and the new material does not, then the value for `foo` will be lost.
     * 
     * However, if the new material also defines `foo` then that value will be transferred. 
     */
    map()
    {
        let newNames = [];
        let newValues = [];

        if(this.parent._materialReference != null)
        {
            let material = this.parent._materialReference;
            let propertyCount = material.properties.length;

            // For each property in the new material...
            for(let i = 0; i < propertyCount; ++i)
            {
                let property  = material.properties[i];
                let prevIndex = this.getPropertyIndex(property.name);
                let value     = (prevIndex == -1) ? property.default : Utils.mergeArrays(this.propertyValues[prevIndex], property.default);

                newNames.push(property.name);
                newValues.push(value);
            }
        }

        this.propertyNames = newNames.slice();
        this.propertyValues = newValues.slice();
    }

    setProperty(index, value)
    {
        if((index < 0) || (index >= this.propertyValues.length))
        {
            return;
        }

        this.propertyValues[index] = value;
        this.dirty = true;
    }

    getPropertyIndex(name)
    {
        for(let i = 0; i < this.propertyNames.length; ++i)
        {
            if(this.propertyNames[i] === name)
            {
                return i;
            }
        }

        return -1;
    }

    getPropertyValue(index, defaultValue)
    {
        return ((index < 0) || (index >= this.propertyValues.length)) ? defaultValue : this.propertyValues[index];
    }
}