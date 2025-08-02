import React from 'react'

const TestPage = () => {
  console.log('TestPage component rendering...')
  
  // Add a simple test to see if React is working
  const [count, setCount] = React.useState(0)
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          🧪 Test Page
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          This is a simple test page to check if React is working.
        </p>
        
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            ✅ React is Working!
          </h2>
          
          <p style={{ 
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            If you can see this content, React is working correctly.
          </p>
          
          {/* Interactive Test */}
          <div style={{ 
            backgroundColor: '#fef3c7',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontWeight: 'bold', color: '#92400e' }}>Interactive Test</h3>
            <p style={{ color: '#d97706' }}>Count: {count}</p>
            <button 
              onClick={() => setCount(count + 1)}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Click me! (+1)
            </button>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ 
              backgroundColor: '#dcfce7',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#166534' }}>Green Card</h3>
              <p style={{ color: '#16a34a' }}>This should be green</p>
            </div>
            
            <div style={{ 
              backgroundColor: '#dbeafe',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#1e40af' }}>Blue Card</h3>
              <p style={{ color: '#2563eb' }}>This should be blue</p>
            </div>
            
            <div style={{ 
              backgroundColor: '#f3e8ff',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#7c3aed' }}>Purple Card</h3>
              <p style={{ color: '#9333ea' }}>This should be purple</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestPage 