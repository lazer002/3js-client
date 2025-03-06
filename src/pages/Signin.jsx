import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { authContext } from '../context/useContext.jsx';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { FaGoogle, FaFacebook, FaEnvelope } from 'react-icons/fa';
// Custom hook to track mouse position
const useMousePosition = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (event) => {
      const { innerWidth, innerHeight } = window;
      setMouse({
        x: (event.clientX / innerWidth) * 2 - 1,
        y: -(event.clientY / innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
  return mouse;
};

// Returns a random position in 3D space
const getRandomPosition = () => [
  (Math.random() - 0.5) * 10, // X axis (-5 to 5)
  (Math.random() - 0.5) * 6,  // Y axis (-3 to 3)
  (Math.random() - 0.5) * 10  // Z axis (-5 to 5)
];

function MovingObject({ glbUrl, color, type, metallic = true,scale=1 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const mouse = useMousePosition();
  const [position] = useState(() => {
    const pos = getRandomPosition();
    return [pos[0], pos[1], 0]; // Keep Z always 0
  });

  const velocity = useRef({
    x: (Math.random() - 0.5) * 0.02,
    y: (Math.random() - 0.5) * 0.02,
  });

  const { scene } = useGLTF(glbUrl);
  const clonedScene = scene.clone();

  useFrame(() => {
    if (!meshRef.current) return;

    const objPos = meshRef.current.position;
    const mousePos = { x: mouse.x * 5, y: mouse.y * 5 };

    if (hovered) {
      objPos.x += (mousePos.x - objPos.x) * 0.1;
      objPos.y += (mousePos.y - objPos.y) * 0.1;
    } else {
      objPos.x += velocity.current.x;
      objPos.y += velocity.current.y;

      if (Math.abs(objPos.x) > 5) velocity.current.x *= -1;
      if (Math.abs(objPos.y) > 3) velocity.current.y *= -1;
    }

    objPos.z = 0; // Keep Z fixed
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <primitive object={clonedScene} scale={[scale, scale, scale]} />
    </mesh>
  );
}


function Signin() {
  const navigate = useNavigate();
  const { setAuth } = useContext(authContext);
  const [user, setUser] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/data', user);
      localStorage.setItem('token', response.data.token);
      setAuth(true);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center">
      <ToastContainer />
      {/* 3D Background */}
      <div className="absolute inset-0 w-full h-full"  style={{ backgroundImage: "url('/3d/229.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <Canvas className="w-full h-full ">
          {/* <Environment preset="warehouse" background /> */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          <pointLight position={[2, 2, 2]} intensity={3} />
          <spotLight position={[0, 5, 5]} angle={0.5} penumbra={1} intensity={4} />
          <MovingObject glbUrl='/3d/3.glb' scale={1}/>
          <MovingObject glbUrl='/3d/4.glb' scale={0.5}/>
          <MovingObject glbUrl='/3d/3.glb' scale={1}/>
          <MovingObject glbUrl='/3d/4.glb' scale={0.5}/>
          <MovingObject glbUrl='/3d/3.glb' scale={1}/>
          <MovingObject glbUrl='/3d/4.glb' scale={1}/>
          <MovingObject glbUrl='/3d/4.glb' scale={0.5}/>
          <MovingObject glbUrl='/3d/4.glb' scale={1}/>
       

          <OrbitControls />
        </Canvas>
      </div>

      {/* Sign-In Form */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative z-10 bg-white/20 backdrop-blur-lg p-10 rounded-lg shadow-lg w-96 border border-white/30">
          <h2 className="text-center text-3xl font-extrabold text-white mb-6">Sign In</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              autoComplete="username"
              placeholder="Username"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />

            <div className="flex justify-between items-center text-white text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 accent-[#747000]" /> Remember Me
              </label>
              <a href="#" className="text-white hover:underline">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white ${
                loading ? 'bg-[#9e9900]' : 'bg-[#747000] hover:bg-[#75743f]'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#747000]`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-white my-4">OR</div>

          <div className="space-x-3 flex justify-center">
            <button className="flex items-center justify-center w-12 h-12 bg-[#747000] text-white rounded-full shadow hover:bg-black">
              <FaGoogle size={24} />
            </button>
            <button className="flex items-center justify-center w-12 h-12 bg-[#747000] text-white rounded-full shadow hover:bg-black">
              <FaFacebook size={24} />
            </button>
            <button className="flex items-center justify-center w-12 h-12 bg-[#747000] text-white rounded-full shadow hover:bg-black">
              <FaEnvelope size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
