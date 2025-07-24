import * as THREE from 'three';

export class Environment {

    scene;
    sky;
    skyUniforms;
    sun;
    light;
    groundMaterial;

    constructor(scene) {

        this.scene = scene;
        this.skyUniforms = {
            topColor: { value: new THREE.Color(0x87ceeb) },    // Day sky
            bottomColor: { value: new THREE.Color(0xfdf6e3) }, // Day horizon
        };

    }


    addGround() {


        this.groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, depthWrite: false });


        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(2000, 2000),
            this.groundMaterial
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }


    addSky() {


        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: this.skyUniforms,
            vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
            fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
    
          void main() {
            float h = normalize(vWorldPosition).y;
            vec3 color = mix(bottomColor, topColor, max(h, 0.0));
            gl_FragColor = vec4(color, 1.0);
          }
        `,
            depthWrite: false,
        });

        this.sky = new THREE.Mesh(
            new THREE.SphereGeometry(400, 32, 15),
            skyMat
        );
        this.scene.add(this.sky);
    }


    addSun() {

        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sun.position.set(100, 200, 100);
        this.scene.add(this.sun);
    }


    render() {
        this.addGround();
        this.addSky();
        this.addSun();


        this.light = new THREE.HemisphereLight(0xffffff, 0x777777);
        this.light.position.set(0, 200, 0);
        this.scene.add(this.light);
        this.scene.add(this.light.clone());
    }


    animate(clock, position) {


        this.sky.position.set(position.x, 0, position.z)

        const time = clock.getElapsedTime();
        let t = (Math.sin(time * 0.01) + 1) / 2; // oscillates between 0 and 1

        // const shaped = Math.pow((Math.sin(time) + 1) / 2, 4); // 4 = more flattening
        // let t=shaped

        // Define day/night colors
        const dayTop = new THREE.Color(0x87ceeb);    // Sky blue
        const nightTop = new THREE.Color(0x00001a);  // Midnight blue
        const dayBottom = new THREE.Color(0xffffff); //(0xfdf6e3); // Warm horizon
        const nightBottom = new THREE.Color(0x000000); // Ground

        // Interpolate sky colors
        this.skyUniforms.topColor.value.lerpColors(nightTop, dayTop, t);
        this.skyUniforms.bottomColor.value.lerpColors(nightBottom, dayBottom, t);

        // Interpolate sun light color and intensity
        this.sun.intensity = THREE.MathUtils.lerp(0.2, 1.0, t);
        this.sun.color.lerpColors(new THREE.Color(0x444488), new THREE.Color(0xffffff), t);

        this.light.color.lerpColors(nightTop, dayTop, t);
        // this.light.groundColor.lerpColors(nightBottom, dayBottom, t);
        const bottomColor = new THREE.Color().lerpColors(nightBottom, dayBottom, t);
        this.light.groundColor.copy(bottomColor); // already doing this
        this.groundMaterial.color.copy(bottomColor);  
        this.scene.fog.color.copy(bottomColor);

    }



}