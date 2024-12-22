import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    description: (
      <>
        Ingest was designed from the ground up to be easily installed 
        and used to get your data pipeline up and running quickly.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    description: (
      <>
        Ingest lets you focus on your data, and we&apos;ll do the chores.
        Go ahead and move your data from anywhere to anywhere.
      </>
    ),
  },
  {
    title: 'Powered by Node.js',
    description: (
      <>
        Extend or customize your data pipeline by reusing any Node.js packages.
        Ingest can be extended while reusing your existing tools.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
