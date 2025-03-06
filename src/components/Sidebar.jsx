import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import namimage from '../assets/images/menu-svg.svg'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const linksRef = useRef([]);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);
  const tlRef = useRef();

  useEffect(() => {
    const tl = gsap.timeline({ paused: true });
    
    tl.fromTo(menuRef.current,
      { 
        y: '-100%',
        display: 'block',
      },
      { 
        y: '0%',
        duration: 1.5,
        ease: 'power3.inOut',
      }
    ).fromTo(linksRef.current,
      { 
        y: 100,
        opacity: 0 
      },
      {
        y: 0,
        delay:0.5,
        opacity: 1,
        duration: 1,
        stagger: 0.4,
        ease: 'power2.out',
      },
      '-=1'
    ).fromTo(imageContainerRef.current,
      { 
        clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        display: 'block',
      },
      {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        duration: 1,
        ease: 'power2.inOut',
      }
    ).fromTo(imageRef.current,
      { 
        scale: 1.5,
        opacity: 0 
      },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
      },
      '-=1'
    );

    tlRef.current = tl;

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (!tlRef.current) return;

    if (isOpen) {
      gsap.set(menuRef.current, { display: 'block' });
      tlRef.current.play();
    } else {
      tlRef.current.reverse();
    }
  }, [isOpen]);

  const menuItems = [
    { path: '/', label: 'Bill Generator' },
    { path: '/history', label: 'History' },
    { path: '/settings', label: 'Settings' }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 p-4 rounded-full bg-black text-[#747000]  transition-colors ${isOpen ? 'z-50' :'z-40' } `}
      >
        {isOpen ? (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <div
        ref={menuRef}
        style={{ display: 'none' }}
        className="fixed top-0 left-0 h-screen w-screen bg-[#222100] text-white z-40"
      >
        <div className="h-full flex">
          <div className="w-1/2 h-full relative flex items-center justify-center">
            <div 
              ref={imageContainerRef}
              className="w-[80vh] h-[80vh] relative"
              style={{ display: 'none' }}
            >
              <img 
                ref={imageRef}
                src={namimage} 
                alt="navImage" 
                className="w-screen h-screen object-cover "
              />
            </div>
          </div>

          <div className="w-1/2 h-full flex items-center justify-center">
            <nav className="space-y-1 text-7xl font-bold">
              {menuItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  ref={el => linksRef.current[index] = el}
                  className="block px-4 py-2 hover:text-[#747000] transition-colors relative group"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="relative z-10">{item.label}</span>
                  <span className="absolute left-0 right-0 h-[1px] bottom-0 bg-[#747000] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 