import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import gsap from 'gsap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFilter, FaChevronDown, FaDownload, FaEllipsisV, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// API base URL


export default function Home() {




  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", mobile: "", address: "", date: "" });
  const [products, setProducts] = useState([{
    name: "",
    description: "",
    quantity: 1,
    price: 0,
    total: 0
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const buttonRef = useRef(null);
  const modalContentRef = useRef(null);
  const API_BASE_URL = 'https://threejs-server-jywz.onrender.com/api';
  const [bills, setBills] = useState([]);



  const billService = {
    createBill: async (billData) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/bills`, billData);
        return response.data;
      } catch (error) {
        console.error('Error creating bill:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create bill');
      }
    },
    getAllBills: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bills`);
        return response.data;
      } catch (error) {
        console.error("Error fetching bills:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch bills");
      }
    },

  };



  const fetchBills = async () => {
    try {

      const data = await billService.getAllBills();
      setBills(data);
    } catch (error) {
      toast.error("Failed to fetch bills!");
    } finally {

    }
  };






  const handleAddProduct = () => {
    setProducts([...products, {
      name: "",
      description: "",
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = field === "quantity" || field === "price"
      ? parseFloat(value) || 0
      : value;
    updatedProducts[index].total = updatedProducts[index].quantity * updatedProducts[index].price;
    setProducts(updatedProducts);
  };

  const calculateTotals = () => {
    const subtotal = products.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * 0.1;
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
  };




  const handleGenerateBill = async () => {
    if (!customer.name || !customer.mobile || products.length === 0) {
      toast.error("Please fill all required fields and add at least one product.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { subtotal, tax, grandTotal } = calculateTotals();

      // Prepare bill data
      const billData = {
        customerDetails: {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          date: customer.date,
        },
        products: products.map(product => ({
          name: product.name,
          description: product.description,
          quantity: product.quantity,
          price: product.price,
          total: product.total,
        })),
        summary: {
          subtotal,
          tax,
          grandTotal,
        },
        createdAt: new Date(),
      };

      // Save bill to the database
      const savedBill = await billService.createBill(billData);

      // Show success message
      toast.success("Bill saved successfully!");

      // Refresh bills list (if needed, you might fetch updated bills here)
      setBills(prevBills => [...prevBills, savedBill]);

      // Generate PDF
      generatePDF(savedBill);

    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Failed to save bill. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = (billData) => {
    try {
      const doc = new jsPDF();

      // Calculate totals from billData
      let subtotal, tax, grandTotal;

      if (billData.summary) {
        // If billData is from saved bill
        ({ subtotal, tax, grandTotal } = billData.summary);
      } else {
        // If generating new bill
        ({ subtotal, tax, grandTotal } = calculateTotals());
      }

      // Add custom font color
      doc.setDrawColor(116, 112, 0);
      doc.setTextColor(116, 112, 0);

      // Header
      doc.setFontSize(35);
      doc.text("INVOICE", doc.internal.pageSize.width / 2, 20, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(20, 25, doc.internal.pageSize.width - 20, 25);

      // Customer Details Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("BILL TO", 20, 40);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      const customerDetails = billData.customerDetails || customer;
      doc.text(`${customerDetails.name}`, 20, 48);
      doc.text(`${customerDetails.mobile}`, 20, 55);
      doc.text(`${customerDetails.address}`, 20, 62);

      // Date on the right
      doc.setFont(undefined, 'bold');
      doc.text("DATE", doc.internal.pageSize.width - 60, 40);
      doc.setFont(undefined, 'normal');
      doc.text(`${customerDetails.date}`, doc.internal.pageSize.width - 60, 48);

      // Products Table
      const productsData = billData.products || products;
      doc.setFontSize(11);
      autoTable(doc, {
        startY: 75,
        head: [["Product Name", "Description", "Quantity", "Price", "Total"]],
        body: productsData.map(p => [
          p.name,
          p.description,
          p.quantity,
          `₹${parseFloat(p.price).toFixed(2)}`,
          `₹${parseFloat(p.total).toFixed(2)}`
        ]),
        headStyles: {
          fillColor: [116, 112, 0],
          textColor: [255, 255, 255],
          fontSize: 11
        },
        bodyStyles: {
          textColor: [116, 112, 0]
        },
        alternateRowStyles: {
          fillColor: [246, 246, 246]
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // Summary section with right alignment
      const summaryX = doc.internal.pageSize.width - 80;

      // Subtotal
      doc.setFontSize(11);
      doc.text("Subtotal:", summaryX, finalY);
      doc.text(`₹${subtotal.toFixed(2)}`, doc.internal.pageSize.width - 20, finalY, { align: 'right' });

      // Tax
      doc.text("Tax (10%):", summaryX, finalY + 8);
      doc.text(`₹${tax.toFixed(2)}`, doc.internal.pageSize.width - 20, finalY + 8, { align: 'right' });

      // Line before grand total
      doc.setLineWidth(0.3);
      doc.line(summaryX - 20, finalY + 12, doc.internal.pageSize.width - 20, finalY + 12);

      // Grand Total
      doc.setFont(undefined, 'bold');
      doc.setFontSize(13);
      doc.text("Grand Total:", summaryX, finalY + 20);
      doc.text(`₹${grandTotal.toFixed(2)}`, doc.internal.pageSize.width - 20, finalY + 20, { align: 'right' });

      // Footer
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text("Thank you for your business!", doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });

      // Create blob and open in new tab
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  useEffect(() => {
    fetchBills();
    const modal = modalRef.current;
    const overlay = overlayRef.current;
    const content = modalContentRef.current;
    const invoiceText = document.querySelector('.invoice-text');
    const formContent = document.querySelector('.form-content');

    if (!modal || !overlay || !content || !invoiceText || !formContent) return;

    if (isModalOpen) {
      // Set initial states
      gsap.set(modal, {
        display: 'block',
        opacity: 0,
        scale: 0.95
      });

      gsap.set(invoiceText, {
        opacity: 0,
        x: -200
      });

      gsap.set(formContent, {
        opacity: 0,
        x: 200
      });

      // Create timeline for animations
      const tl = gsap.timeline();

      tl.to(overlay, {
        opacity: 1,
        duration: 0.2
      })
        .to(modal, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'back.out(1.2)'
        })
        .to(invoiceText, {
          opacity: 1,
          x: 0,
          duration: 0.3,
          ease: 'power3.out',
          delay: 0.5
        })
        .to(formContent, {
          opacity: 1,
          x: 0,
          duration: 0.3,
          ease: 'power3.out'
        }, '<'); // '<' makes this animation start at the same time as the previous one

    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(modal, { display: 'none' });
        }
      });

      tl.to(invoiceText, {
        opacity: 0,
        x: -200,
        duration: 0.3,
        ease: 'power2.in'
      })
        .to(formContent, {
          opacity: 0,
          x: 200,
          duration: 0.3,
          ease: 'power2.in'
        }, '<')
        .to(modal, {
          opacity: 0,
          scale: 0.95,
          duration: 0.2
        }, '-=0.1')
        .to(overlay, {
          opacity: 0,
          duration: 0.2
        }, '-=0.1');
    }

    return () => {
      gsap.killTweensOf([modal, overlay, content, invoiceText, formContent]);
    };
  }, [isModalOpen]);







  const cardsRef = useRef([]);

  useEffect(() => {
    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.20, duration: 0.8, ease: "power3.out" }
    );
  }, [bills]);


  return (
    <div className="min-h-screen p-6 relative bg-[#4b4800]">
      <ToastContainer />
      {/* Open Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-[#747000] text-white p-4 rounded-full shadow-lg hover:bg-[#222100] transition-colors z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black bg-opacity-50 `}
        style={{ display: isModalOpen ? 'block' : 'none', opacity: 0 }}
        onClick={() => setIsModalOpen(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#747000]"></div>
            <p className="mt-2 text-[#747000]">Saving bill...</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90vh] bg-white rounded-lg shadow-2xl  z-50 overflow-hidden`}
        style={{ display: 'none' }}
      >
        <div ref={modalContentRef} className="h-full flex flex-col">
          {/* Header with close button */}
          <div className="flex justify-end p-4 absolute right-0 top-0 z-10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-[#222100] rounded-full transition-colors text-[#747000]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main content with split layout */}
          <div className="flex h-full">
            {/* Left side - Vertical text */}
            <div className="w-1/4 bg-[#747000] flex items-center justify-center relative">
              <div className="invoice-text absolute transform -rotate-90 text-white text-8xl font-bold tracking-widest">
                INVOICE
              </div>
            </div>

            {/* Right side - Form content */}
            <div className="w-3/4 flex flex-col form-content">
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl font-bold text-[#747000] mb-8">Generate Bill</h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6 text-[#747000]">
                      <input
                        className="border-b border-gray-300 p-2 w-full focus:outline-none focus:border-[#747000]"
                        placeholder="Customer Name"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      />
                      <input
                        className="border-b border-gray-300 p-2 w-full focus:outline-none focus:border-[#747000]"
                        placeholder="Customer Mobile Number"
                        value={customer.mobile}
                        onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                      />
                    </div>
                    <input
                      className="border-b border-gray-300 p-2 w-full focus:outline-none focus:border-[#747000] text-[#747000]"
                      placeholder="Customer Address"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    />
                    <input
                      className="border-b border-gray-300 p-2 w-full focus:outline-none focus:border-[#747000] text-white bg-[#747000] rounded-xl"
                      type="date"
                      value={customer.date}
                      onChange={(e) => setCustomer({ ...customer, date: e.target.value })}
                    />
                  </div>

                  <h3 className="text-xl font-semibold mt-10 mb-6 text-[#747000]">Products</h3>
                  <div className="space-y-4">
                    {products.map((product, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 text-[#747000]">
                        <input
                          className="border-b border-gray-300 p-2 focus:outline-none focus:border-[#747000]"
                          placeholder="Product Name"
                          value={product.name}
                          onChange={(e) => handleProductChange(index, "name", e.target.value)}
                        />
                        <input
                          className="border-b border-gray-300 p-2 focus:outline-none focus:border-[#747000]"
                          placeholder="Description"
                          value={product.description}
                          onChange={(e) => handleProductChange(index, "description", e.target.value)}
                        />
                        <input
                          className="border-b border-gray-300 p-2 focus:outline-none focus:border-[#747000]"
                          type="number"
                          placeholder="Quantity"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                        />
                        <input
                          className="border-b border-gray-300 p-2 focus:outline-none focus:border-[#747000]"
                          type="number"
                          placeholder="Price"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, "price", e.target.value)}
                        />
                        <input
                          className="border-b border-gray-300 p-2 focus:outline-none focus:border-[#747000]"
                          value={product.total}
                          disabled
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-6">
                    <button
                      className="bg-[#747000] text-white px-6 py-2 rounded-full hover:bg-[#222100] transition-colors"
                      onClick={handleAddProduct}
                    >
                      Add Product +
                    </button>
                  </div>

                  {products.length > 0 && (
                    <div className="mt-8 border-t pt-6 text-[#747000]">
                      <h3 className="text-xl font-semibold mb-4 text-[#747000]">Order Summary</h3>
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{calculateTotals().subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax (10%):</span>
                          <span className="font-medium">₹{calculateTotals().tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Grand Total:</span>
                          <span>₹{calculateTotals().grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-6 bg-gray-50">
                <div className="max-w-3xl mx-auto flex justify-end gap-4">
                  <button
                    className="px-6 py-2 border border-[#747000] text-[#747000] rounded-full hover:bg-[#747000] hover:text-white transition-colors"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-[#747000] text-white px-8 py-2 rounded-full hover:bg-[#222100] transition-colors"
                    onClick={handleGenerateBill}
                  >
                    Generate Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      <div className="flex h-screen bg-white rounded-3xl">
        <div className="w-1/4 bg-[#747000] flex items-center justify-center relative rounded-3xl">
          <div className="invoice-text drop-shadow-2xl absolute transform -rotate-90 text-white text-8xl font-bold tracking-widest">
            INVOICE
          </div>
        </div>

        <div className="w-3/4 max-w-7xl mx-auto mt-16 space-y-6 ">
          <h2 className="text-2xl font-semibold text-[#747000] text-center">Invoices</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.map((bill, index) => (
              <div
                key={bill._id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="bg-white rounded-xl  border border-l-4 shadow-2xl border-[#b5a400] p-5 relative transition-all transform hover:scale-105 hover:shadow-lg"
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#747000]">{bill.customerDetails.name}</h3>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 shadow-lg">
                    ${bill.summary.grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-500">Invoice ID: {bill._id}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(bill.customerDetails.date).toLocaleDateString()}</p>
                  <p className="text-lg font-bold text-[#b5a400]">${bill.summary.grandTotal.toFixed(2)}</p>
                </div>

                {/* Products List */}
                <div className="mt-4 border-t border-gray-300 pt-3">
                  <h4 className="text-sm font-semibold text-[#747000] mb-2">Products:</h4>
                  <div className="space-y-2 ">
                    {bill.products.map((product) => (
                      <div key={product._id} className="flex justify-between items-center bg-gray-100 rounded-lg p-2 shadow-md">
                        <span className="text-sm font-medium text-gray-800">{product.name}</span>
                        <span className="text-sm text-gray-600">Qty: {product.quantity}</span>
                        <span className="text-sm text-gray-600">${product.price.toFixed(2)}</span>
                        <span className="text-sm font-semibold text-[#b5a400]">${product.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-between items-center">
                  <button className="text-[#747000] text-sm font-medium hover:text-[#b5a400] transition">
                    View Details
                  </button>

                  <div className="relative group">
                    <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                      <FaEllipsisV size={16} />
                    </button>
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg hidden group-hover:block z-10 border border-[#b5a400]">
                      <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f6f4d2]">View Details</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f6f4d2]">Download PDF</a>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f6f4d2]">Mark as Paid</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}




          </div>
        </div>
      </div>

    </div>
  );
}
